from django.http import Http404

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
            .get(
                id=product_id,
                is_active=True,
            )
        )

    except Product.DoesNotExist:
        raise Http404("Product not found.")