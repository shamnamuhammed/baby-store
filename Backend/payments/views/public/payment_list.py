from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated


from core.pagination import CustomPagination
from core.response import success_response

from payments.models import Payment
from payments.serializers import PaymentSerializer
from payments.selectors.public.payment import get_user_payments

@extend_schema(
    summary="Payment List",
    description="Retrieve all payments of the authenticated user.",
    responses=PaymentSerializer(many=True),
    tags=["Payments"],
)
class PaymentListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        payments = get_user_payments(request.user)

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            payments,
            request,
        )

        serializer = PaymentSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )