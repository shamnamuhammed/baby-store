from rest_framework.views import APIView
from rest_framework import status

from drf_spectacular.utils import extend_schema

from core.pagination import CustomPagination
from core.response import success_response

from core.permission import IsAdmin

from orders.selectors.admin import (
    get_admin_orders,
    get_admin_order_by_id,
)

from orders.serializers.admin.order import (
    AdminOrderSerializer,
    AdminOrderStatusSerializer,
)

from orders.services.admin import (
    update_order,
    delete_order,
)


class AdminOrderListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List Orders",
        description="Retrieve all orders for admin.",
        tags=["Admin Orders"],
        responses=AdminOrderSerializer(many=True),
    )
    def get(self, request):

        orders = get_admin_orders(request)

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            orders,
            request,
        )

        serializer = AdminOrderSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )


class AdminOrderDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Retrieve Order",
        description="Retrieve a single order.",
        tags=["Admin Orders"],
        responses=AdminOrderSerializer,
    )
    def get(self, request, pk):

        order = get_admin_order_by_id(
            order_id=pk,
        )

        serializer = AdminOrderSerializer(order)

        return success_response(
            message="Order retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Update Order Status",
        description="Update order status.",
        tags=["Admin Orders"],
        request=AdminOrderStatusSerializer,
        responses=AdminOrderSerializer,
    )
    def patch(self, request, pk):

        order = get_admin_order_by_id(
            order_id=pk,
        )

        serializer = AdminOrderStatusSerializer(
            order,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        order = update_order(
            order=order,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Order updated successfully.",
            data=AdminOrderSerializer(order).data,
            status_code=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Delete Order",
        description="Delete an order.",
        tags=["Admin Orders"],
        responses={204: None},
    )
    def delete(self, request, pk):

        order = get_admin_order_by_id(
            order_id=pk,
        )

        delete_order(
            order=order,
        )

        return success_response(
            message="Order deleted successfully.",
            status_code=status.HTTP_204_NO_CONTENT,
        )