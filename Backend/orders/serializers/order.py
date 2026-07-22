from rest_framework import serializers

from orders.models import Order
from .order_item import OrderItemSerializer


class OrderSerializer(serializers.ModelSerializer):

    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Order
        fields = (
            "id",
            "status",
            "total_amount",
            "created_at",
            "items",
        )
