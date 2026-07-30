from celery import shared_task
from django.utils import timezone

from coupons.models import Coupon


@shared_task
def update_coupon_status():
    """
    Automatically activate and deactivate coupons.
    """

    now = timezone.now()

    # Activate valid coupons
    Coupon.objects.filter(
        valid_from__lte=now,
        valid_to__gte=now,
    ).update(is_active=True)

    # Deactivate expired coupons
    Coupon.objects.filter(
        valid_to__lt=now,
    ).update(is_active=False)