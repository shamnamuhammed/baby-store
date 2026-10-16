
from rest_framework import serializers

from orders.models import Order, OrderAddress
from .order_item import OrderItemSerializer


class OrderAddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderAddress
        fields = (
            "full_name",
            "phone_number",
            "address_line",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
        )


class OrderSerializer(serializers.ModelSerializer):
    coupon_code = serializers.CharField(
        source="coupon.code",
        read_only=True,
        allow_null=True,
    )

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    shipping_address = OrderAddressSerializer(
        read_only=True,
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "total_amount",
            "discount_amount",
            "final_amount",
            "coupon_code",
            "items",
            "shipping_address",
            "created_at",
        )
