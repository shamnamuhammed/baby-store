from decimal import Decimal

from django.db import transaction
from django.utils import timezone
from django.db.models import F
from rest_framework.exceptions import ValidationError

from coupons.models import Coupon
from coupons.models import CouponUsage
from coupons.selectors.public import has_user_used_coupon


@transaction.atomic
def apply_coupon(*, coupon, order, user):

    now = timezone.now()

    # ---------------------------------------------------------
    # 1. Coupon validation
    # ---------------------------------------------------------

    if not coupon.is_active:
        raise ValidationError({
            "message": "This coupon is inactive."
        })

    if now < coupon.valid_from:
        raise ValidationError({
            "message": "This coupon is not active yet."
        })

    if now > coupon.valid_to:
        raise ValidationError({
            "message": "This coupon has expired."
        })

    # ---------------------------------------------------------
    # 2. Order validation
    # ---------------------------------------------------------

    if order.status != order.OrderStatus.PENDING:
        raise ValidationError({
            "message": "Coupon can only be applied to a pending order."
        })

    if order.coupon:
        raise ValidationError({
            "message": "A coupon is already applied to this order."
        })

    if order.total_amount < coupon.minimum_order_amount:
        raise ValidationError({
            "message": (
                f"Minimum order amount is "
                f"{coupon.minimum_order_amount}."
            )
        })

    # ---------------------------------------------------------
    # 3. Coupon usage validation
    # ---------------------------------------------------------

    if coupon.used_count >= coupon.usage_limit:
        raise ValidationError({
            "message": "This coupon usage limit has been reached."
        })

    if coupon.usage_per_user and has_user_used_coupon(
        coupon=coupon,
        user=user,
    ):
        raise ValidationError({
            "message": "You have already used this coupon."
        })

    # ---------------------------------------------------------
    # 4. Calculate coupon discount
    # ---------------------------------------------------------

    if coupon.discount_type == Coupon.DiscountType.FIXED:

        discount = coupon.discount_value

    else:

        discount = (
            order.total_amount
            * coupon.discount_value
            / Decimal("100")
        )

        if (
            coupon.maximum_discount is not None
            and discount > coupon.maximum_discount
        ):
            discount = coupon.maximum_discount

    # ---------------------------------------------------------
    # 5. Never allow discount > order amount
    # ---------------------------------------------------------

    discount = min(
        discount,
        order.total_amount,
    )

    discount = discount.quantize(Decimal("0.01"))

    # ---------------------------------------------------------
    # 6. Calculate final amount
    # ---------------------------------------------------------

    final_total = (
        order.total_amount - discount
    )

    if final_total < Decimal("0.00"):
        final_total = Decimal("0.00")

    # ---------------------------------------------------------
    # 7. Save coupon information
    #
    # IMPORTANT:
    # total_amount is NOT changed.
    # ---------------------------------------------------------

    order.coupon = coupon
    order.discount_amount = discount
    order.final_amount = final_total

    order.save(
        update_fields=[
            "coupon",
            "discount_amount",
            "final_amount",
            "updated_at",
        ]
    )

    # ---------------------------------------------------------
    # IMPORTANT:
    #
    # Do NOT create CouponUsage here.
    # Do NOT increment used_count here.
    #
    # Coupon usage will be finalized only after
    # successful payment.
    # ---------------------------------------------------------

    return {
        "discount": discount,
        "final_total": final_total,
    }


@transaction.atomic
def finalize_coupon_usage(*, order, user):
    """
    Finalize coupon usage after successful payment.

    CouponUsage represents a successfully consumed coupon.
    """

    coupon = order.coupon

    # No coupon applied
    if not coupon:
        return None

    # Prevent duplicate coupon usage for the same order
    if CouponUsage.objects.filter(order=order).exists():
        return None

    # Lock the coupon row so concurrent payments
    # cannot exceed the usage limit.
    coupon = (
        coupon.__class__
        .objects
        .select_for_update()
        .get(pk=coupon.pk)
    )

    # Check total usage limit again at payment time.
    if coupon.used_count >= coupon.usage_limit:
        raise ValidationError({
            "message": "Coupon usage limit has been reached."
        })

    # Check per-user usage again at payment time.
    if (
        coupon.usage_per_user
        and CouponUsage.objects.filter(
            coupon=coupon,
            user=user,
        ).exists()
    ):
        raise ValidationError({
            "message": "You have already used this coupon."
        })

    # Create successful coupon usage record.
    CouponUsage.objects.create(
        coupon=coupon,
        user=user,
        order=order,
        discount_amount=order.discount_amount,
    )

    # Increment usage count while coupon row is locked.
    coupon.used_count = F("used_count") + 1

    coupon.save(
        update_fields=[
            "used_count",
        ]
    )

    coupon.refresh_from_db(
        fields=["used_count"]
    )

    return coupon