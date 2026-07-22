from rest_framework import serializers
from products.serializers.public.product_image import ProductImageSerializer
from products.models import Product


class AdminProductSerializer(serializers.ModelSerializer):

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
    )

    brand_name = serializers.CharField(
        source="brand.name",
        read_only=True,
    )
    
    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product

        fields = (
            "id",
            "name",
            "slug",
            "sku",
            "description",
            "category",
            "category_name",
            "brand",
            "brand_name",
            "price",
            "discount_price",
            "stock_quantity",
            "images",
            "is_active",
            "is_featured",
            "created_at",
            "updated_at",
        )
        
        read_only_fields = (
            "id",
            "slug",
            "created_at",
            "updated_at",
        )
        
class AdminProductCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Product

        fields = (
            "name",
            "sku",
            "description",
            "category",
            "brand",
            "price",
            "discount_price",
            "stock_quantity",
            "weight",
            "is_active",
            "is_featured",
        )