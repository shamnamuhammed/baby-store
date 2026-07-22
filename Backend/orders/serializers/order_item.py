from rest_framework import serializers
from orders.models import OrderItem 
from .product import OrderProductSerializer

class OrderItemSerializer(serializers.ModelSerializer):

    product = OrderProductSerializer(read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "product",
            "quantity",
            "price",
            "subtotal",
        )