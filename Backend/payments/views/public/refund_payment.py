from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from drf_spectacular.utils import extend_schema
from core.response import success_response
from payments.serializers.payment import PaymentSerializer
from payments.serializers.refund_payment import (
    RefundPaymentSerializer,
)
from payments.selectors import (
    get_payment_for_refund,
)
from services.public.refund_services import (
    RefundService,
)
class RefundPaymentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Request Refund",
        description="Request a refund for a successful payment.",
        tags=["Payments"],
        request=RefundPaymentSerializer,
        responses=PaymentSerializer,
    )
    def post(self, request, pk):

        serializer = RefundPaymentSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        payment = get_payment_for_refund(
            payment_id=pk,
            user=request.user,
        )

        payment = RefundService.request_refund(
            payment=payment,
            reason=serializer.validated_data["reason"],
        )

        return success_response(
            message="Refund request submitted successfully.",
            data=PaymentSerializer(payment).data,
            status_code=status.HTTP_200_OK,
        )