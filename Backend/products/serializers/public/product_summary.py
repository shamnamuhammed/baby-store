from rest_framework import serializers

from products.models import Product


class ProductSummarySerializer(serializers.ModelSerializer):

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "price",
        ]