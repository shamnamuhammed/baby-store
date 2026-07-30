from django.utils import timezone

from offers.models import Offer


def get_active_product_offer(*, product):
    """
    Return the active offer for a product.
    """

    return (
        Offer.objects.filter(
            offer_type=Offer.OfferType.PRODUCT,
            product=product,
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        )
        .order_by("-discount_value")
        .first()
    )


def get_active_category_offer(*, category):
    """
    Return the active offer for a category.
    """

    return (
        Offer.objects.filter(
            offer_type=Offer.OfferType.CATEGORY,
            category=category,
            is_active=True,
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now(),
        )
        .order_by("-discount_value")
        .first()
    )


# def get_best_offer(*, product):
#     """
#     Return the best offer applicable to a product.
#     """

#     product_offer = get_active_product_offer(
#         product=product,
#     )

#     category_offer = get_active_category_offer(
#         category=product.category,
#     )

#     if product_offer and category_offer:

#         if product_offer.discount_value >= category_offer.discount_value:
#             return product_offer

#         return category_offer

    return product_offer or category_offer