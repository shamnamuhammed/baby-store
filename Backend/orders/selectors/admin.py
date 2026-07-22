from django.http import Http404
from django.db.models import Q

from orders.models import Order


def get_admin_orders(request):
    """
    Return all orders with search, filter and ordering.
    """

    queryset = (
        Order.objects
        .select_related(
            "user",
            "shipping_address",
        )
        .prefetch_related(
            "items",
            "items__product",
        )
    )

    # ------------------------
    # Search
    # ------------------------

    search = request.query_params.get("search")

    if search:

        queryset = queryset.filter(

            Q(id__icontains=search)

            | Q(user__first_name__icontains=search)

            | Q(user__last_name__icontains=search)

            | Q(user__email__icontains=search)

            | Q(user__username__icontains=search)

        )

    # ------------------------
    # Status Filter
    # ------------------------

    status = request.query_params.get("status")

    if status:

        queryset = queryset.filter(
            status=status,
        )

    # ------------------------
    # Ordering
    # ------------------------

    ordering = request.query_params.get("ordering")

    allowed = [

        "created_at",
        "-created_at",

        "total_amount",
        "-total_amount",

        "status",
        "-status",

    ]

    if ordering in allowed:

        queryset = queryset.order_by(ordering)

    return queryset


def get_admin_order_by_id(*, order_id):
    """
    Return a single order.
    """

    try:

        return (

            Order.objects

            .select_related(
                "user",
                "shipping_address",
            )

            .prefetch_related(
                "items",
                "items__product",
            )

            .get(
                pk=order_id,
            )

        )

    except Order.DoesNotExist:

        raise Http404(
            "Order not found.",
        )