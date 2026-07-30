from rest_framework import serializers

from orders.models import OrderItem


class AdminOrderItemSerializer(serializers.ModelSerializer):

    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
    )

    product_sku = serializers.CharField(
        source="product.sku",
        read_only=True,
    )

    class Meta:
        model = OrderItem

        fields = (
            "id",
            "product",
            "product_name",
            "product_sku",
            "quantity",
            "unit_price",
            "subtotal",
        )