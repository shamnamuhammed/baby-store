from django.db import transaction
from django.db.models import F
from django.utils import timezone
from payments.models import Payment
from cart.models import Cart
from orders.models import Order
from products.models import Product
from products.services.stock import StockService
from notifications.tasks import send_order_confirmation_email_task
class StripeWebhookService:

    @staticmethod
    @transaction.atomic
    def payment_success(payment, payment_intent):

        if payment.status == Payment.PaymentStatus.SUCCESS:
            return

        order = payment.order

        # 1. Validate stock
        # StockService.validate_stock(order)

        # 2. Reduce stock
        StockService.reduce_stock(order)

        # 3. Confirm order
        order.status = Order.OrderStatus.CONFIRMED
        order.save(update_fields=["status"])
        
        send_order_confirmation_email_task.delay(order.id)

        # 4. Update payment
        payment.status = Payment.PaymentStatus.SUCCESS
        payment.transaction_id = payment_intent
        payment.stripe_payment_intent_id = payment_intent
        payment.paid_at = timezone.now()

        payment.save(
            update_fields=[
                "status",
                "transaction_id",
                "stripe_payment_intent_id",
                "paid_at",
            ]
        )

        # 5. Clear cart
        try:
            cart = Cart.objects.get(user=order.user)
            cart.items.all().delete()
        except Cart.DoesNotExist:
            pass