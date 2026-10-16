from django.conf import settings
from django.db import transaction
from django.utils import timezone

import stripe
from rest_framework.exceptions import ValidationError

from cart.models import Cart
from coupons.services.public import finalize_coupon_usage
from notifications.tasks import send_order_confirmation_email_task
from orders.models import Order
from payments.models import Payment
from products.services.stock import StockService
from notifications.models import Notification
from notifications.services.public.notification import NotificationService

stripe.api_key = settings.STRIPE_SECRET_KEY


class PaymentService:

    @staticmethod
    @transaction.atomic
    def create_payment(
        *,
        user,
        order,
        payment_method,
    ):
        """
        Create a payment for a pending order.

        The order row is locked before checking payment state.
        This prevents concurrent requests from creating or
        completing payments for the same order at the same time.

        COD payments are completed immediately.

        Stripe payments create a Checkout Session and remain
        PENDING until Stripe confirms payment through the webhook.
        """

        # --------------------------------------------------
        # Lock the order
        # --------------------------------------------------

        locked_order = (
            Order.objects
            .select_for_update()
            .get(
                pk=order.pk,
                user=user,
            )
        )

        # --------------------------------------------------
        # Prevent duplicate payment
        # --------------------------------------------------

        if hasattr(locked_order, "payment"):
            raise ValidationError({
                "message": "Payment already exists for this order."
            })

        # --------------------------------------------------
        # Order must be pending
        # --------------------------------------------------

        if locked_order.status != Order.OrderStatus.PENDING:
            raise ValidationError({
                "message": "Only pending orders can be paid."
            })

        # --------------------------------------------------
        # Early stock validation
        # --------------------------------------------------

        StockService.validate_stock(locked_order)

        # --------------------------------------------------
        # Create payment
        # --------------------------------------------------

        payment = Payment.objects.create(
            order=locked_order,
            amount=locked_order.final_amount,
            payment_method=payment_method,
            status=Payment.PaymentStatus.PENDING,
        )

        # ==================================================
        # COD PAYMENT
        # ==================================================

        if payment_method == Payment.PaymentMethod.COD:

            payment.status = Payment.PaymentStatus.SUCCESS
            payment.transaction_id = f"COD-{payment.id}"
            payment.paid_at = timezone.now()

            payment.save(
                update_fields=[
                    "status",
                    "transaction_id",
                    "paid_at",
                    "updated_at",
                ]
            )

            # Finalize coupon usage after successful payment.
            finalize_coupon_usage(
                order=locked_order,
                user=user,
            )

            # Reduce stock.
            StockService.reduce_stock(locked_order)

            # Confirm order.
            locked_order.status = Order.OrderStatus.CONFIRMED

            locked_order.save(
                update_fields=[
                    "status",
                    "updated_at",
                ]
            )
            
            # Send real-time notification only after
            # the transaction successfully commits.

            transaction.on_commit(
                lambda: NotificationService.create_notification(
                    user=user,
                    title="Order Confirmed",
                    message=(
                        f"Your order #{locked_order.id} "
                        "has been confirmed."
                    ),
                    notification_type=(
                        Notification.NotificationType.ORDER
                    ),
                )
            )

            # Clear cart.
            try:
                cart = Cart.objects.get(user=user)
                cart.items.all().delete()
            except Cart.DoesNotExist:
                pass

            # Send email only after successful DB commit.
            transaction.on_commit(
                lambda: send_order_confirmation_email_task.delay(
                    locked_order.id
                )
            )

            return payment

        # ==================================================
        # STRIPE PAYMENT
        # ==================================================

        if payment_method == Payment.PaymentMethod.STRIPE:

            checkout_session = PaymentService.create_checkout_session(
                payment=payment,
            )

            return checkout_session

        raise ValidationError({
            "message": "Invalid payment method."
        })

    @staticmethod
    def create_checkout_session(*, payment):

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],

            mode="payment",

            metadata={
                "payment_id": str(payment.id),
                "order_id": str(payment.order_id),
            },

            line_items=[
                {
                    "price_data": {
                        "currency": "inr",

                        "product_data": {
                            "name": f"Order #{payment.order.id}",
                        },

                        "unit_amount": int(
                            payment.amount * 100
                        ),
                    },

                    "quantity": 1,
                }
            ],

            success_url=(
                "http://127.0.0.1:3000/"
                "payment/success"
                "?session_id={CHECKOUT_SESSION_ID}"
            ),

            cancel_url=(
                "http://127.0.0.1:3000/payment/cancel"
            ),
        )

        payment.stripe_checkout_session_id = checkout_session.id

        payment.save(
            update_fields=[
                "stripe_checkout_session_id",
                "updated_at",
            ]
        )

        return checkout_session