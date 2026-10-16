from django.db import transaction
from django.utils import timezone

from cart.models import Cart
from coupons.services.public import finalize_coupon_usage
from notifications.tasks import send_order_confirmation_email_task
from orders.models import Order
from payments.models import Payment
from products.services.stock import StockService
from notifications.models import Notification
from notifications.services.public.notification import NotificationService


class StripeWebhookService:

    @staticmethod
    @transaction.atomic
    def payment_success(
        *,
        payment,
        payment_intent,
        stripe_session,
    ):
        """
        Finalize a successful Stripe payment.

        Payment and Order rows are locked before state changes
        so concurrent webhook requests cannot process the same
        payment simultaneously.
        """

        # --------------------------------------------------
        # Lock Payment
        # --------------------------------------------------

        locked_payment = (
            Payment.objects
            .select_for_update()
            .select_related("order")
            .get(pk=payment.pk)
        )

        # --------------------------------------------------
        # Idempotency
        # --------------------------------------------------

        if locked_payment.status == Payment.PaymentStatus.SUCCESS:
            return locked_payment

        if locked_payment.status != Payment.PaymentStatus.PENDING:
            raise ValueError(
                "Payment is not in a payable state."
            )

        # --------------------------------------------------
        # Lock Order
        # --------------------------------------------------

        order = (
            Order.objects
            .select_for_update()
            .get(pk=locked_payment.order_id)
        )

        # --------------------------------------------------
        # Order validation
        # --------------------------------------------------

        if order.status != Order.OrderStatus.PENDING:
            raise ValueError(
                "Order is not in pending state."
            )

        # --------------------------------------------------
        # Verify Stripe payment status
        # --------------------------------------------------

        if stripe_session.get("payment_status") != "paid":
            raise ValueError(
                "Stripe payment has not been completed."
            )

        # --------------------------------------------------
        # Verify currency
        # --------------------------------------------------

        currency = stripe_session.get("currency")

        if currency != "inr":
            raise ValueError(
                "Invalid Stripe payment currency."
            )

        # --------------------------------------------------
        # Verify amount
        # --------------------------------------------------

        stripe_amount = stripe_session.get("amount_total")

        expected_amount = int(
            locked_payment.amount * 100
        )

        if stripe_amount != expected_amount:
            raise ValueError(
                "Stripe payment amount does not match order amount."
            )

        # --------------------------------------------------
        # Early stock validation
        # --------------------------------------------------

        StockService.validate_stock(order)

        # --------------------------------------------------
        # Finalize coupon usage
        # --------------------------------------------------

        finalize_coupon_usage(
            order=order,
            user=order.user,
        )

        # --------------------------------------------------
        # Update payment
        # --------------------------------------------------

        now = timezone.now()

        locked_payment.status = Payment.PaymentStatus.SUCCESS
        locked_payment.transaction_id = payment_intent
        locked_payment.stripe_payment_intent_id = payment_intent
        locked_payment.paid_at = now
        locked_payment.gateway_response = stripe_session

        locked_payment.save(
            update_fields=[
                "status",
                "transaction_id",
                "stripe_payment_intent_id",
                "paid_at",
                "gateway_response",
                "updated_at",
            ]
        )

        # --------------------------------------------------
        # Reduce stock
        # --------------------------------------------------

        StockService.reduce_stock(order)

        # --------------------------------------------------
        # Confirm order
        # --------------------------------------------------

        order.status = Order.OrderStatus.CONFIRMED

        order.save(
            update_fields=[
                "status",
                "updated_at",
            ]
        )

        transaction.on_commit(
            lambda: NotificationService.create_notification(
                user=order.user,
                title="Payment Successful",
                message=(
                    f"Payment for order #{order.id} "
                    "was successful and your order has been confirmed."
                ),
                notification_type=Notification.NotificationType.PAYMENT,
            )
        )

        # --------------------------------------------------
        # Clear cart
        # --------------------------------------------------

        try:
            cart = Cart.objects.get(
                user=order.user
            )

            cart.items.all().delete()

        except Cart.DoesNotExist:
            pass

        # --------------------------------------------------
        # Send email after DB commit
        # --------------------------------------------------

        transaction.on_commit(
            lambda: send_order_confirmation_email_task.delay(
                order.id
            )
        )

        return locked_payment