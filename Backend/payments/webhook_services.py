from django.db import transaction
from django.db.models import F

from payments.models import Payment
from cart.models import Cart
from orders.models import Order


class StripeWebhookService:

    @staticmethod
    @transaction.atomic
    def payment_success(payment, payment_intent):

        # Prevent duplicate webhook execution
        if payment.status == Payment.PaymentStatus.SUCCESS:
            return

        payment.status = Payment.PaymentStatus.SUCCESS
        payment.transaction_id = payment_intent
        payment.stripe_payment_intent_id = payment_intent

        payment.save(
            update_fields=[
                "status",
                "transaction_id",
                "stripe_payment_intent_id",
            ]
        )

        order = payment.order

        if order.status != Order.OrderStatus.PENDING:
            return

        for item in order.items.select_related("product"):

            product = item.product

            product.stock_quantity = (
                F("stock_quantity") - item.quantity
            )

            product.save(
                update_fields=["stock_quantity"]
            )

        order.status = Order.OrderStatus.CONFIRMED

        order.save(
            update_fields=["status"]
        )

        try:
            cart = Cart.objects.get(
                user=order.user
            )

            cart.items.all().delete()

        except Cart.DoesNotExist:
            pass