from rest_framework import serializers
from products.models import ProductImage


class ProductImageSerializer(serializers.ModelSerializer):

    class Meta:
        model = ProductImage
        fields = (
            "id",
            "image",
            "alt_text",
            "is_primary",
        )
        read_only_fields = ("id",)