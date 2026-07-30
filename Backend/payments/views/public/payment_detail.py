from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from core.response import success_response

from payments.models import Payment
from payments.serializers import PaymentSerializer
from payments.selectors.public import get_payment_by_id

@extend_schema(
    summary="Payment Detail",
    description="Retrieve a single payment of the authenticated user.",
    responses=PaymentSerializer,
    tags=["Payments"],
)
class PaymentDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        
        payment = get_payment_by_id(
            payment_id=pk,
            user=request.user,
        )


        serializer = PaymentSerializer(payment)

        return success_response(
            message="Payment retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )