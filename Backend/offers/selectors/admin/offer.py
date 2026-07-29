from django.http import Http404

from offers.models import Offer


def get_all_offers():
    """
    Return all offers ordered by newest first.
    """

    return Offer.objects.select_related(
        "product",
        "category",
    ).all()


def get_offer_by_id(*, offer_id):
    """
    Return a single offer by ID.
    """

    try:
        return Offer.objects.select_related(
            "product",
            "category",
        ).get(
            pk=offer_id,
        )

    except Offer.DoesNotExist:
        raise Http404("Offer not found.")