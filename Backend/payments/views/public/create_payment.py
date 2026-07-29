from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from core.response import success_response
from payments.models import Payment
from payments.selectors.public.payment import get_order_for_payment
from payments.serializers import PaymentSerializer,CreatePaymentSerializer
from payments.services.public import PaymentService


@extend_schema(
    summary="Create Payment",
    description="Create a payment for an order.",
    request=CreatePaymentSerializer,
    responses=PaymentSerializer,
    tags=["Payments"],
)
class CreatePaymentAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CreatePaymentSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        order_id = serializer.validated_data["order_id"]
        payment_method = serializer.validated_data["payment_method"]

        order = get_order_for_payment(
            order_id=order_id,
            user=request.user,
        )

        result= PaymentService.create_payment(
            user=request.user,
            order=order,
            payment_method=payment_method,
        )

        if payment_method == Payment.PaymentMethod.STRIPE:
            
            return success_response(
                message="Checkout session created.",
                data={
                    "checkout_url": result.url,
                },
                status_code=status.HTTP_200_OK,
            )
        return success_response(
                message="Payment completed successfully.",
                data=PaymentSerializer(result).data,
                status_code=status.HTTP_201_CREATED,
            )