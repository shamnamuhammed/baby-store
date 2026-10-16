import stripe

from django.conf import settings
from django.db import transaction
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from notifications.models import Notification
from notifications.services.public.notification import NotificationService
from notifications.tasks import send_refund_email_task
from orders.models import Order
from payments.models import Payment
from products.services.stock import StockService


stripe.api_key = settings.STRIPE_SECRET_KEY


class RefundService:

    @staticmethod
    @transaction.atomic
    def request_refund(*, payment, reason):
        """
        User requests a refund for a successful payment.

        SUCCESS -> REFUND_REQUESTED
        """

        locked_payment = (
            Payment.objects
            .select_for_update()
            .select_related("order")
            .get(pk=payment.pk)
        )

        if locked_payment.status == Payment.PaymentStatus.REFUNDED:
            raise ValidationError({
                "message": "Payment already refunded."
            })

        if (
            locked_payment.status
            == Payment.PaymentStatus.REFUND_REQUESTED
        ):
            raise ValidationError({
                "message": "Refund request already exists."
            })

        if locked_payment.status != Payment.PaymentStatus.SUCCESS:
            raise ValidationError({
                "message": "Only successful payments can be refunded."
            })

        order = (
            Order.objects
            .select_for_update()
            .get(pk=locked_payment.order_id)
        )

        if order.status == Order.OrderStatus.CANCELLED:
            raise ValidationError({
                "message": "Order already cancelled."
            })

        if order.status != Order.OrderStatus.CONFIRMED:
            raise ValidationError({
                "message": "Only confirmed orders can be refunded."
            })

        if not reason or not reason.strip():
            raise ValidationError({
                "message": "Refund reason is required."
            })

        locked_payment.status = Payment.PaymentStatus.REFUND_REQUESTED
        locked_payment.refund_reason = reason.strip()

        locked_payment.save(
            update_fields=[
                "status",
                "refund_reason",
                "updated_at",
            ]
        )

        return locked_payment

    @staticmethod
    @transaction.atomic
    def complete_refund(*, payment, reason=None):
        """
        Complete an already requested refund.

        REFUND_REQUESTED
            ->
        REFUNDED
            ->
        restore stock
            ->
        cancel order
        """

        # --------------------------------------------------
        # Lock payment
        # --------------------------------------------------

        locked_payment = (
            Payment.objects
            .select_for_update()
            .select_related("order")
            .get(pk=payment.pk)
        )

        # --------------------------------------------------
        # Validate refund state
        # --------------------------------------------------

        if (
            locked_payment.status
            == Payment.PaymentStatus.REFUNDED
        ):
            raise ValidationError({
                "message": "Payment already refunded."
            })

        if (
            locked_payment.status
            != Payment.PaymentStatus.REFUND_REQUESTED
        ):
            raise ValidationError({
                "message": "Only requested refunds can be approved."
            })

        # --------------------------------------------------
        # Lock order
        # --------------------------------------------------

        order = (
            Order.objects
            .select_for_update()
            .get(pk=locked_payment.order_id)
        )

        if reason and reason.strip():
            locked_payment.refund_reason = reason.strip()

        stripe_refund = None

        # ==================================================
        # STRIPE REFUND
        # ==================================================

        if (
            locked_payment.payment_method
            == Payment.PaymentMethod.STRIPE
        ):

            if not locked_payment.stripe_payment_intent_id:
                raise ValidationError({
                    "message": (
                        "Stripe payment intent ID is missing. "
                        "Cannot process Stripe refund."
                    )
                })

            try:
                stripe_refund = stripe.Refund.create(
                    payment_intent=(
                        locked_payment.stripe_payment_intent_id
                    ),
                    amount=int(
                        locked_payment.amount * 100
                    ),
                    metadata={
                        "payment_id": str(locked_payment.id),
                        "order_id": str(locked_payment.order_id),
                    },
                    idempotency_key=(
                        f"refund-payment-{locked_payment.id}"
                    ),
                )

            except stripe.error.StripeError:
                # Do not expose Stripe's internal error details
                # to the client.
                raise ValidationError({
                    "message": "Stripe refund failed."
                })

        # ==================================================
        # LOCAL REFUND UPDATE
        # ==================================================

        locked_payment.status = Payment.PaymentStatus.REFUNDED
        locked_payment.refunded_amount = locked_payment.amount
        locked_payment.refunded_at = timezone.now()

        if stripe_refund:

            gateway_response = (
                locked_payment.gateway_response or {}
            )

            gateway_response["refund"] = {
                "id": stripe_refund.id,
                "status": stripe_refund.status,
                "amount": stripe_refund.amount,
                "currency": stripe_refund.currency,
            }

            locked_payment.gateway_response = gateway_response
            locked_payment.transaction_id = stripe_refund.id

        locked_payment.save(
            update_fields=[
                "status",
                "refund_reason",
                "refunded_amount",
                "refunded_at",
                "gateway_response",
                "transaction_id",
                "updated_at",
            ]
        )

        # ==================================================
        # RESTORE STOCK
        # ==================================================

        StockService.restore_stock(order)

        # ==================================================
        # CANCEL ORDER
        # ==================================================

        order.status = Order.OrderStatus.CANCELLED

        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        transaction.on_commit(
            lambda: NotificationService.create_notification(
                user=order.user,
                title="Refund Approved",
                message=(
                    f"Your refund for order #{order.id} "
                    "has been approved."
                ),
                notification_type=Notification.NotificationType.REFUND,
            )
        )

        # ==================================================
        # EMAIL AFTER COMMIT
        # ==================================================

        transaction.on_commit(
            lambda: send_refund_email_task.delay(
                locked_payment.id
            )
        )

        return locked_payment