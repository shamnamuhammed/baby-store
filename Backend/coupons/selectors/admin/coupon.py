from rest_framework.exceptions import NotFound

from coupons.models import Coupon

def get_all_coupons():
    """
    Return all coupons.
    """

    return Coupon.objects.order_by("-created_at")


def get_coupon_by_id(*, coupon_id):
    """
    Return coupon by id.
    """

    try:
        return Coupon.objects.get(
            pk=coupon_id,
        )

    except Coupon.DoesNotExist:
        raise NotFound(
            {
                "message": "Coupon not found."
            }
        )