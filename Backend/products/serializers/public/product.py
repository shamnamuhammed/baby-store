from rest_framework import serializers
from products.models import Product
from .product_image import ProductImageSerializer
from .category import CategorySerializer
from .brand import BrandSerializer

class ProductSerializer(serializers.ModelSerializer):

    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

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
        )