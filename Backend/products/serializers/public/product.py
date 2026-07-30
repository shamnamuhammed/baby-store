from rest_framework import serializers
from products.models import Product
from .product_image import ProductImageSerializer
from .category import CategorySerializer
from .brand import BrandSerializer
from offers.selectors.public import (
    get_active_product_offer,
    get_active_category_offer,
)

from offers.services.public import (
    get_best_discount,
)


class ProductSerializer(serializers.ModelSerializer):

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
    
    def get_offer_data(self, obj):

        product_offer = get_active_product_offer(
            product=obj,
        )

        category_offer = get_active_category_offer(
            category=obj.category,
        )

        return get_best_discount(
            product=obj,
            product_offer=product_offer,
            category_offer=category_offer,
        )
    
    def get_discount(self, obj):

        return self.get_offer_data(obj)["discount"]
    
    def get_final_price(self, obj):
        return self.get_offer_data(obj)["final_price"]

    def get_offer(self, obj):
        offer = self.get_offer_data(obj)["offer"]
        return offer.name if offer else None




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
            
        )

        read_only_fields = (
            "id",
            "slug",
        )
        
        
        
class ProductDetailSerializer(serializers.ModelSerializer):

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
    
    def get_offer_data(self, obj):

        product_offer = get_active_product_offer(
            product=obj,
        )

        category_offer = get_active_category_offer(
            category=obj.category,
        )

        return get_best_discount(
            product=obj,
            product_offer=product_offer,
            category_offer=category_offer,
        )


    def get_discount(self, obj):
        return self.get_offer_data(obj)["discount"]


    def get_final_price(self, obj):
        return self.get_offer_data(obj)["final_price"]


    def get_offer(self, obj):

        offer = self.get_offer_data(obj)["offer"]

        return offer.name if offer else None

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
        )