from rest_framework import serializers
from decimal import Decimal
from cart.models import CartItem
from products.serializers.public import ProductSummarySerializer
from offers.selectors.public import (
    get_active_product_offer,
    get_active_category_offer,
)

from offers.services.public import (
    get_best_discount,
)

class CartItemSerializer(serializers.ModelSerializer):
     
    product = ProductSummarySerializer(
        read_only=True,
    )

    unit_price = serializers.SerializerMethodField()

    discount = serializers.SerializerMethodField()

    final_price = serializers.SerializerMethodField()

    subtotal = serializers.SerializerMethodField()
    
    available_stock = serializers.IntegerField(
        source="product.stock_quantity",
        read_only=True,
    )

    stock_valid = serializers.SerializerMethodField()
    
    def get_offer_data(self, obj):

        product_offer = get_active_product_offer(
            product=obj.product,
        )

        category_offer = get_active_category_offer(
            category=obj.product.category,
        )

        return get_best_discount(
            product=obj.product,
            product_offer=product_offer,
            category_offer=category_offer,
        )
   
    class Meta:
        model = CartItem
        fields = [
            "id",
            "product",
            "quantity",
            "unit_price",
            "discount",
            "final_price",
            "available_stock",
            "stock_valid",
             "subtotal",
        ]
        
    def get_subtotal(self, obj):

        final_price = self.get_offer_data(obj)["final_price"]

        return final_price * obj.quantity
    
    
    def get_stock_valid(self, obj):
        return obj.quantity <= obj.product.stock_quantity
    
    def get_unit_price(self, obj):
        return obj.product.price


    def get_discount(self, obj):
        return self.get_offer_data(obj)["discount"]


    def get_final_price(self, obj):
        return self.get_offer_data(obj)["final_price"]