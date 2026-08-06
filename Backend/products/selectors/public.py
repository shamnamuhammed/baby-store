from django.http import Http404
from django.db.models import Avg, Count
from products.models import Product


def get_product_by_id(*, product_id):
    """
    Return a single active product.
    """

    try:
        return (
            Product.objects
            .select_related(
                "category",
                "brand",
            )
            .prefetch_related(
                "images",
            )
            .annotate(
                average_rating=Avg("reviews__rating"),
                review_count=Count("reviews"),
            )
            .get(
                id=product_id,
                is_active=True,
            )
        )

    except Product.DoesNotExist:
        raise Http404("Product not found.")