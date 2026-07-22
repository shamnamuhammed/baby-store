from rest_framework import serializers

from orders.models import Order

from orders.serializers.admin.order_item import (
    AdminOrderItemSerializer,
)

from orders.serializers.admin.order_address import (
    AdminOrderAddressSerializer,
)


class AdminOrderSerializer(serializers.ModelSerializer):

    customer_name = serializers.CharField(
        source="user.get_full_name",
        read_only=True,
    )

    customer_email = serializers.EmailField(
        source="user.email",
        read_only=True,
    )

    shipping_address = AdminOrderAddressSerializer(
        read_only=True,
    )

    items = AdminOrderItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order

        fields = (
            "id",
            "customer_name",
            "customer_email",
            "status",
            "total_amount",
            "shipping_address",
            "items",
            "created_at",
            "updated_at",
        )


class AdminOrderStatusSerializer(serializers.ModelSerializer):

    class Meta:
        model = Order

        fields = (
            "status",
        )