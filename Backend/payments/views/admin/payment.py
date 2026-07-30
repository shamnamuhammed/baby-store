from rest_framework.views import APIView
from rest_framework import status

from drf_spectacular.utils import extend_schema
from payments.selectors.admin.admin import (
    get_admin_payment_by_id,
    get_admin_payments,
)
from core.pagination import CustomPagination
from core.response import success_response
from core.permission import IsAdmin



from payments.serializers.admin.admin import (
    AdminPaymentSerializer,
)


class AdminPaymentListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List Payments",
        description="Retrieve all payments.",
        tags=["Admin Payments"],
        responses=AdminPaymentSerializer(many=True),
    )
    def get(self, request):

        payments = get_admin_payments(request)

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            payments,
            request,
        )

        serializer = AdminPaymentSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )
        
        
class AdminPaymentDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Retrieve Payment",
        description="Retrieve a single payment.",
        tags=["Admin Payments"],
        responses=AdminPaymentSerializer,
    )
    def get(self, request, pk):

        payment = get_admin_payment_by_id(
            payment_id=pk,
        )

        serializer = AdminPaymentSerializer(
            payment,
        )

        return success_response(
            message="Payment retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )