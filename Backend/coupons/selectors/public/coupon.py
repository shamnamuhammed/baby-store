from django.utils import timezone
from rest_framework.exceptions import ValidationError
from coupons.models import CouponUsage
from coupons.models import Coupon


def get_coupon_by_code(*, code):
    """
    Return an active coupon by coupon code.
    """

    try:
        coupon = Coupon.objects.get(
            code=code.upper(),
            is_active=True,
        )
    except Coupon.DoesNotExist:
        raise ValidationError(
            {
                "message": "Invalid coupon code."
            }
        )

    now = timezone.now()

    if coupon.valid_from > now:
        raise ValidationError(
            {
                "message": "Coupon is not active yet."
            }
        )

    if coupon.valid_to< now:
        raise ValidationError(
            {
                "message": "Coupon has expired."
            }
        )

    return coupon





def has_user_used_coupon(*, coupon, user):
    """
    Return True if user already used coupon.
    """

    return CouponUsage.objects.filter(
        coupon=coupon,
        user=user,
    ).exists()