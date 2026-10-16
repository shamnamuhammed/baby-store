
from rest_framework import serializers

from offers.models import Offer


class PublicOfferSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(
        source="product.name",
        read_only=True,
        allow_null=True,
    )

    category_name = serializers.CharField(
        source="category.name",
        read_only=True,
        allow_null=True,
    )

    class Meta:
        model = Offer
        fields = (
            "id",
            "name",
            "offer_type",
            "product",
            "product_name",
            "category",
            "category_name",
            "discount_type",
            "discount_value",
            "maximum_discount",
            "start_date",
            "end_date",
        )
