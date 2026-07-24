from django.db import transaction
from django.db.models import F

from rest_framework.exceptions import ValidationError
from coupons.models import Coupon 
from coupons.models import CouponUsage


@transaction.atomic
def remove_coupon(*, order):

    if not order.coupon:
        raise ValidationError(
            {
                "message": "No coupon applied."
            }
        )

    coupon = order.coupon

    order.total_amount += order.discount_amount

    order.discount_amount = 0
    order.coupon = None

    order.save(
        update_fields=[
            "coupon",
            "discount_amount",
            "total_amount",
        ]
    )

    CouponUsage.objects.filter(
        order=order,
    ).delete()

    Coupon.objects.filter(pk=coupon.pk).update(
        used_count=F("used_count") - 1
    )

    coupon.refresh_from_db()

    return order