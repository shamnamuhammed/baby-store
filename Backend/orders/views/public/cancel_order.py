from drf_spectacular.utils import extend_schema
from core.response import success_response

from orders.services.public import cancel_order
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status


@extend_schema(
    summary="Cancel Order",
    description="Cancel a pending order belonging to the authenticated user.",
    tags=["Orders"],
)
class CancelOrderAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        
        cancel_order(
            order_id=pk,
            user=request.user,
        )

        return success_response(
            message="Order cancelled successfully.",
            status_code=status.HTTP_200_OK,
        )

