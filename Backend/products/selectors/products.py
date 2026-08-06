from products.models import Product
from products.filters import ProductFilter
from django.db.models import Avg, Count

def get_products(request, queryset=None):
    """
    Apply search, filter and ordering.
    """

    if queryset is None:
        queryset = Product.objects.all()

    queryset = queryset.annotate(
        average_rating=Avg("reviews__rating"),
        review_count=Count("reviews"),
    )
        

    # Search
    search = request.query_params.get("search")
    if search:
        queryset = queryset.filter(
            name__icontains=search
        )

    # Filter
    queryset = ProductFilter(
        request.GET,
        queryset=queryset,
    ).qs

    # Ordering
    ordering = request.query_params.get("ordering")

    allowed = [
        "price",
        "-price",
        "name",
        "-name",
        "created_at",
        "-created_at",
    ]

    if ordering in allowed:
        queryset = queryset.order_by(ordering)

    return queryset