from django.db import transaction
from rest_framework.exceptions import ValidationError
from decimal import Decimal


@transaction.atomic
def remove_coupon(*, order, user):

    if order.status != order.OrderStatus.PENDING:
        raise ValidationError({
            "message": "Coupon can only be removed from a pending order."
        })

    if not order.coupon:
        raise ValidationError({
            "message": "No coupon is applied to this order."
        })

    order.coupon = None
    order.discount_amount = Decimal("0.00")
    order.final_amount = order.total_amount

    order.save(
        update_fields=[
            "coupon",
            "discount_amount",
            "final_amount",
            "updated_at",
        ]
    )

    return order