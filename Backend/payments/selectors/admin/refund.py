from django.http import Http404

from payments.models import Payment


def get_admin_refunds(request):

    queryset = (
        Payment.objects
        .select_related(
            "order",
            "order__user",
        )
    )

    search = request.query_params.get("search")

    if search:

        queryset = queryset.filter(
            order__user__username__icontains=search,
        )

    status = request.query_params.get("status")

    if status:

        queryset = queryset.filter(
            status=status,
        )

    ordering = request.query_params.get("ordering")

    allowed = [

        "created_at",
        "-created_at",

        "amount",
        "-amount",

        "status",
        "-status",

    ]

    if ordering in allowed:

        queryset = queryset.order_by(
            ordering,
        )

    return queryset


def get_admin_refund_by_id(*, payment_id):

    try:

        return (
            Payment.objects
            .select_related(
                "order",
                "order__user",
            )
            .get(
                pk=payment_id,
            )
        )

    except Payment.DoesNotExist:

        raise Http404(
            "Refund not found."
        )