
from decimal import Decimal

from rest_framework import serializers

from products.models import Product
from .product_image import ProductImageSerializer
from .category import CategorySerializer
from .brand import BrandSerializer

from offers.selectors.public import (
    get_active_product_offer,
    get_active_category_offer,
)
from offers.services.public import get_best_discount


class ProductPricingMixin:
    """
    Shared pricing logic for product list and detail serializers.

    Rules:
    1. Product.price is the original price.
    2. Product.discount_price is an optional manual sale price.
    3. Product/category offers are calculated against the original price.
    4. The lowest valid selling price wins; discounts are not stacked.
    """

    def get_offer_data(self, obj):
        if not hasattr(self, "_pricing_cache"):
            self._pricing_cache = {}

        if obj.pk in self._pricing_cache:
            return self._pricing_cache[obj.pk]

        original_price = Decimal(str(obj.price))
        manual_price = obj.discount_price

        if manual_price is not None:
            manual_price = Decimal(str(manual_price))

            if not (Decimal("0.00") < manual_price < original_price):
                manual_price = None

        product_offer = get_active_product_offer(product=obj)
        category_offer = get_active_category_offer(
            category=obj.category,
        )

        offer_data = get_best_discount(
            product=obj,
            product_offer=product_offer,
            category_offer=category_offer,
        )

        automatic_price = Decimal(
            str(offer_data["final_price"])
        )

        automatic_offer = offer_data["offer"]

        # Select the best valid price without stacking discounts.
        if (
            automatic_offer
            and automatic_price < original_price
            and (
                manual_price is None
                or automatic_price <= manual_price
            )
        ):
            final_price = automatic_price
            offer_label = automatic_offer.name

        elif manual_price is not None:
            final_price = manual_price
            offer_label = "Sale Price"

        else:
            final_price = original_price
            offer_label = None

        total_discount = max(
            original_price - final_price,
            Decimal("0.00"),
        )

        result = {
            "discount": total_discount,
            "final_price": final_price,
            "offer": offer_label,
        }

        self._pricing_cache[obj.pk] = result
        return result

    def get_discount(self, obj):
        # This is a currency amount, not a percentage.
        return self.get_offer_data(obj)["discount"]

    def get_final_price(self, obj):
        return self.get_offer_data(obj)["final_price"]

    def get_offer(self, obj):
        return self.get_offer_data(obj)["offer"]


class ProductSerializer(
    ProductPricingMixin,
    serializers.ModelSerializer,
):
    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    original_price = serializers.DecimalField(
        source="price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    discount = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    offer = serializers.SerializerMethodField()

    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "brand",
            "name",
            "slug",
            "sku",
            "description",
            "price",
            "discount_price",
            "stock_quantity",
            "weight",
            "is_active",
            "is_featured",
            "images",
            "original_price",
            "offer",
            "discount",
            "final_price",
            "average_rating",
            "review_count",
        )
        read_only_fields = (
            "id",
            "slug",
        )


class ProductDetailSerializer(
    ProductPricingMixin,
    serializers.ModelSerializer,
):
    category = CategorySerializer(read_only=True)
    brand = BrandSerializer(read_only=True)

    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    original_price = serializers.DecimalField(
        source="price",
        max_digits=10,
        decimal_places=2,
        read_only=True,
    )

    discount = serializers.SerializerMethodField()
    final_price = serializers.SerializerMethodField()
    offer = serializers.SerializerMethodField()

    average_rating = serializers.FloatField(read_only=True)
    review_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = (
            "id",
            "category",
            "brand",
            "name",
            "slug",
            "sku",
            "description",
            "price",
            "original_price",
            "discount",
            "final_price",
            "offer",
            "discount_price",
            "stock_quantity",
            "weight",
            "is_active",
            "is_featured",
            "images",
            "average_rating",
            "review_count",
        )
