from drf_spectacular.utils import extend_schema
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.response import success_response
from orders.models import Order
from orders.serializers import OrderSerializer
from core.pagination import CustomPagination
from orders.selectors.public import get_user_orders


@extend_schema(
    summary="My Orders",
    description="Retrieve all orders of the authenticated user.",
    responses=OrderSerializer(many=True),
    tags=["Orders"],
)
class OrderListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):
        
        orders = get_user_orders(request.user)


        
        paginator = CustomPagination()
        # Custom message for this API
        paginator.message = "Orders retrieved successfully."

        page = paginator.paginate_queryset(
            orders,
            request,
        )

        serializer = OrderSerializer(
            page,
            many=True,
        )
        return paginator.get_paginated_response(
            serializer.data,
        )

