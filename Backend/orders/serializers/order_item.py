from rest_framework import serializers

from orders.models import OrderItem
from products.serializers.public import ProductSummarySerializer


class OrderItemSerializer(serializers.ModelSerializer):

    product = ProductSummarySerializer(
        read_only=True,
    )

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "quantity",
            "unit_price",
            "discount",
            "final_price",
            "subtotal",
        )