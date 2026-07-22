from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError

from payments.models import Payment
from orders.models import Order



class RefundService:

    @staticmethod
    @transaction.atomic
    def request_refund(*,payment,reason,):
        if payment.status == Payment.PaymentStatus.REFUNDED:
            raise ValidationError(
                {
                    "message": "Payment already refunded."
                }
            )
            
        if payment.status != Payment.PaymentStatus.SUCCESS:
            raise ValidationError(
                {
                    "message": "Only successful payments can be refunded."
                }
            )
            
        order = payment.order

        if order.status == Order.OrderStatus.CANCELLED:
            raise ValidationError(
                {
                    "message": "Order already cancelled."
                }
            )
            
        if payment.payment_method == Payment.PaymentMethod.COD:

            payment.status = (
                Payment.PaymentStatus.REFUND_REQUESTED
            )

            payment.refund_reason = reason

            payment.save(
                update_fields=[
                    "status",
                    "refund_reason",
                ]
            )

            return payment
                # Stripe
        return RefundService.complete_refund(
                payment=payment,
                reason=reason,
            )
        

    
    
    @staticmethod
    @transaction.atomic
    def complete_refund(*, payment, reason=None):

        if payment.status == Payment.PaymentStatus.REFUNDED:
            return payment

        if reason:
            payment.refund_reason = reason

        payment.status = Payment.PaymentStatus.REFUNDED
        payment.refund_amount = payment.amount
        payment.refunded_at = timezone.now()

        payment.save(
            update_fields=[
                "status",
                "refund_reason",
                "refund_amount",
                "refunded_at",
            ]
        )

        order = payment.order

        for item in order.items.select_related("product"):

            product = item.product

            product.stock_quantity += item.quantity

            product.save(
                update_fields=[
                    "stock_quantity",
                ]
            )

        order.status = Order.OrderStatus.CANCELLED

        order.save(
            update_fields=[
                "status",
            ]
        )

        return payment