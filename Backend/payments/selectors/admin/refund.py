from django.http import Http404

from payments.models import Payment


def get_admin_refunds(request):
    queryset = (
        Payment.objects
        .select_related(
            "order",
            "order__user",
        )
        .filter(
            status__in=[
                Payment.PaymentStatus.REFUND_REQUESTED,
                Payment.PaymentStatus.REFUNDED,
            ]
        )
    )

    search = request.query_params.get("search")

    if search:
        queryset = queryset.filter(
            order__user__username__icontains=search
        )

    status = request.query_params.get("status")

    if status:
        queryset = queryset.filter(
            status=status
        )

    ordering = request.query_params.get("ordering")

    allowed_ordering = [
        "created_at",
        "-created_at",
        "amount",
        "-amount",
        "status",
        "-status",
    ]

    if ordering in allowed_ordering:
        queryset = queryset.order_by(ordering)

    return queryset


def get_admin_refund_by_id(*, payment_id):
    """
    Return a refund payment for admin operations.

    Admin authorization is handled by IsAdmin on the view.
    """

    try:
        return (
            Payment.objects
            .select_related(
                "order",
                "order__user",
            )
            .get(
                pk=payment_id,
                status__in=[
                    Payment.PaymentStatus.REFUND_REQUESTED,
                    Payment.PaymentStatus.REFUNDED,
                ],
            )
        )

    except Payment.DoesNotExist:
        raise Http404("Refund not found.")