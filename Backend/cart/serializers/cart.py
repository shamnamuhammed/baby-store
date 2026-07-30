from decimal import Decimal

from rest_framework import serializers

from cart.models import Cart
from .cart_item import CartItemSerializer

from offers.selectors.public import (
    get_active_product_offer,
    get_active_category_offer,
)

from offers.services.public import (
    get_best_discount,
)


class CartSerializer(serializers.ModelSerializer):

    items = CartItemSerializer(
        many=True,
        read_only=True,
    )

    subtotal = serializers.SerializerMethodField()

    offer_discount = serializers.SerializerMethodField()

    coupon_discount = serializers.SerializerMethodField()

    total = serializers.SerializerMethodField()
    
    # total_discount = serializers.SerializerMethodField()

    # final_total = serializers.SerializerMethodField()

    # total_savings = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = (
            "id",
            "items",
            "subtotal",
            "offer_discount",
            "coupon_discount",
            "total",
            # "total_discount",
            # "final_total",
            # "total_savings",
        )

    def get_subtotal(self, obj):

        return sum(
            item.product.price * item.quantity
            for item in obj.items.all()
        )

    def get_offer_discount(self, obj):

        total_discount = Decimal("0.00")

        for item in obj.items.all():

            product_offer = get_active_product_offer(
                product=item.product,
            )

            category_offer = get_active_category_offer(
                category=item.product.category,
            )

            result = get_best_discount(
                product=item.product,
                product_offer=product_offer,
                category_offer=category_offer,
            )

            total_discount += (
                result["discount"] * item.quantity
            )

        return total_discount

    def get_coupon_discount(self, obj):

        # We'll integrate this after the coupon is attached
        return Decimal("0.00")

    def get_total(self, obj):

        subtotal = self.get_subtotal(obj)

        offer_discount = self.get_offer_discount(obj)

        coupon_discount = self.get_coupon_discount(obj)

        return subtotal - offer_discount - coupon_discount