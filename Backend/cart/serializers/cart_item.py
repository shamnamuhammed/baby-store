from rest_framework import serializers
from decimal import Decimal
from cart.models import CartItem
from products.serializers.public import ProductSummarySerializer

class CartItemSerializer(serializers.ModelSerializer):
     
    product = ProductSummarySerializer(
        read_only=True,
    )

    subtotal = serializers.SerializerMethodField()
    
   
    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "quantity",
             "subtotal",
        ]
        
    def get_subtotal(self, obj):
        """
        Calculate subtotal for each cart item.
        """

        return  obj.product.price * obj.quantity