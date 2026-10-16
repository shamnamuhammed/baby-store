
from django.utils import timezone

from offers.models import Offer


def get_active_public_offers():
    """
    Return offers that are active and valid at the current time.
    Used by the public offers endpoint.
    """
    now = timezone.now()

    return (
        Offer.objects.select_related("product", "category")
        .filter(
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )
        .order_by("-created_at")
    )


def get_active_product_offer(*, product):
    """
    Return the latest active offer for a specific product,
    or None when no valid product offer exists.
    """
    now = timezone.now()

    return (
        Offer.objects.filter(
            offer_type=Offer.OfferType.PRODUCT,
            product=product,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )
        .order_by("-created_at")
        .first()
    )


def get_active_category_offer(*, category):
    """
    Return the latest active offer for a specific category,
    or None when no valid category offer exists.
    """
    now = timezone.now()

    return (
        Offer.objects.filter(
            offer_type=Offer.OfferType.CATEGORY,
            category=category,
            is_active=True,
            start_date__lte=now,
            end_date__gte=now,
        )
        .order_by("-created_at")
        .first()
    )
