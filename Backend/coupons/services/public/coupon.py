from decimal import Decimal
from orders.models import Order
from coupons.models import Coupon
from django.db import transaction
from django.db.models import F
from django.utils import timezone

from rest_framework.exceptions import ValidationError

from coupons.models import CouponUsage
from coupons.selectors.public.coupon import has_user_used_coupon


@transaction.atomic
def apply_coupon(*, coupon, order, user):
    """
    Apply coupon to an order.
    """

    # Coupon active
    if not coupon.is_active:
        raise ValidationError({
            "message": "Coupon is inactive."
        })

    # Coupon expired
    if timezone.now() > coupon.valid_to:
        raise ValidationError({
            "message": "Coupon has expired."
        })

    # Coupon not started
    if timezone.now() < coupon.valid_from:
        raise ValidationError({
            "message": "Coupon is not yet active."
        })

    # Minimum order amount
    if order.total_amount < coupon.minimum_order_amount:
        raise ValidationError({
            "message": (
                f"Minimum order amount is ₹{coupon.minimum_order_amount}."
            )
        })

    # Total usage limit
    if coupon.used_count >= coupon.usage_limit:
        raise ValidationError({
            "message": "Coupon usage limit reached."
        })

    # Per-user usage
    if (
        coupon.usage_per_user
        and has_user_used_coupon(
            coupon=coupon,
            user=user,
        )
    ):
        raise ValidationError({
            "message": "You have already used this coupon."
        })
        
    if order.coupon:
        raise ValidationError(
            {
                "message": "A coupon has already been applied to this order."
            }
        )
        
    if order.status != Order.OrderStatus.PENDING:
        raise ValidationError(
            {
                "message": "Coupon can only be applied to pending orders."
            }
        )

    # -------------------------
    # Calculate Discount
    # -------------------------

    if coupon.discount_type == coupon.DiscountType.FIXED:

        discount = coupon.discount_value

    else:

        discount = (
            order.total_amount * coupon.discount_value
        ) / Decimal("100")

        if (
            coupon.maximum_discount
            and discount > coupon.maximum_discount
        ):
            discount = coupon.maximum_discount

    final_total = order.total_amount - discount

    if final_total < 0:
        final_total = Decimal("0")

    # -------------------------
    # Update Order
    # -------------------------

    order.coupon = coupon
    order.discount_amount = discount
    order.total_amount = final_total

    order.save(
        update_fields=[
            "coupon",
            "discount_amount",
            "total_amount",
        ]
    )

    # -------------------------
    # Save Coupon Usage
    # -------------------------

    CouponUsage.objects.create(
        coupon=coupon,
        user=user,
        order=order,
        discount_amount=discount,
    )

    # -------------------------
    # Increase Used Count
    # -------------------------

    # coupon.used_count = F("used_count") + 1

    # coupon.save(
    #     update_fields=[
    #         "used_count",
    #     ]
    # )
    Coupon.objects.filter(pk=coupon.pk).update(
            used_count=F("used_count") + 1
                )

    coupon.refresh_from_db()

    return {
        "discount": discount,
        "final_total": final_total,
    }