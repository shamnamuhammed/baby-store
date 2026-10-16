
from rest_framework import serializers

from products.models import Product
from .product_image import ProductImageSerializer


class ProductSummarySerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "price",
            "images",
        ]
