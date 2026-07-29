from django.http import Http404
from django.db.models import Q

from payments.models import Payment


def get_admin_payments(request):
    """
    Return all payments with search, filter and ordering.
    """

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

            Q(id__icontains=search)

            | Q(transaction_id__icontains=search)

            | Q(order__user__first_name__icontains=search)

            | Q(order__user__last_name__icontains=search)

            | Q(order__user__email__icontains=search)

            | Q(order__user__username__icontains=search)

        )
        
    status = request.query_params.get("status")

    if status:

        queryset = queryset.filter(
            status=status,
        )
        
    payment_method = request.query_params.get(
        "payment_method"
    )

    if payment_method:

        queryset = queryset.filter(
            payment_method=payment_method,
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



def get_admin_payment_by_id(*, payment_id):
    """
    Return a single payment.
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
            )

        )

    except Payment.DoesNotExist:

        raise Http404(
            "Payment not found.",
        )