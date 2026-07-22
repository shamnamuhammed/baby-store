from rest_framework import serializers

from cart.models import Cart
from .cart_item import CartItemSerializer


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True,
    )
    
    total = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "total",
        ]
        
        
    def get_total(self, obj):
        """
        Calculate the total price of all cart items.
        """

        total = sum(
            item.product.price * item.quantity
            for item in obj.items.all()
        )

        return total