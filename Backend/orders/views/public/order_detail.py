from drf_spectacular.utils import extend_schema
from core.response import success_response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from orders.selectors.public import get_order_by_id
from orders.serializers import OrderSerializer


@extend_schema(
    summary="Order Detail",
    description="Retrieve a specific order of the authenticated user.",
    responses=OrderSerializer,
    tags=["Orders"],
)
class OrderDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        
        order = get_order_by_id(
            order_id=pk,
            user=request.user,
        )

        serializer = OrderSerializer(order)

        return success_response(
            message="Order retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

