from django.db import transaction
from django.db.models import F
import stripe
from rest_framework.exceptions import ValidationError
from django.conf import settings
from cart.models import Cart
from orders.models import (
    Order,
)
from payments.models import Payment
from django.utils import timezone
from products.services.stock import StockService
from notifications.tasks import send_order_confirmation_email_task
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
        Create payment and complete order processing.
        
        """
        
        StockService.validate_stock(order)

        # Prevent duplicate payment
        if hasattr(order, "payment"):
            raise ValidationError(
                {
                    "message": "Payment already exists for this order."
                }
            )

        # Order must be pending
        if order.status != Order.OrderStatus.PENDING:
            raise ValidationError(
                {
                    "message": "Only pending orders can be paid."
                }
            )

        # Create payment
        payment = Payment.objects.create(
            order=order,
            amount=order.total_amount,
            payment_method=payment_method,
            status=Payment.PaymentStatus.PENDING,
        )

        # COD Payment
        if payment_method == Payment.PaymentMethod.COD:

            payment.status = Payment.PaymentStatus.SUCCESS
            payment.transaction_id = f"COD-{payment.id}"
            payment.paid_at = timezone.now()
            payment.save(update_fields=[
                    "status",
                    "transaction_id",
                ])


            # Reduce Stock
            for item in order.items.select_related("product"):

                product = item.product

                if item.quantity > product.stock_quantity:
                    raise ValidationError(
                        {
                            "message": f"{product.name} is out of stock."
                        }
                    )

                product.stock_quantity = F("stock_quantity") - item.quantity
                product.save(update_fields=["stock_quantity"])


            # Confirm Order
            order.status = Order.OrderStatus.CONFIRMED
            order.save(update_fields=["status"])
            
            # Send order confirmation email
            send_order_confirmation_email_task.delay(order.id)


            # Clear Cart
            try:
                cart = Cart.objects.get(user=user)
                cart.items.all().delete()
            except Cart.DoesNotExist:
                pass
            
            return payment
        
    # Stripe Payment
    # -----------------------
        elif payment_method == Payment.PaymentMethod.STRIPE:

            checkout_session = PaymentService.create_checkout_session(
                payment=payment,
            )

            return checkout_session

        raise ValidationError(
            {
                "message": "Invalid payment method."
            }
        )
        
        
    
    
    @staticmethod
    def create_checkout_session(*, payment):

        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],

            mode="payment",
            # metadata={
            #     "payment_id": payment.id,
            #     }

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

            success_url="http://127.0.0.1:3000/payment/success?session_id={CHECKOUT_SESSION_ID}",

            cancel_url="http://127.0.0.1:3000/payment/cancel",
        )

        payment.stripe_checkout_session_id = checkout_session.id

        payment.save(
            update_fields=[
                "stripe_checkout_session_id",
            ]
        )

        return checkout_session