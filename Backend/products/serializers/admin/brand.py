from rest_framework import serializers

from products.models import Brand


class AdminBrandSerializer(serializers.ModelSerializer):

    product_count = serializers.IntegerField(
        source="products.count",
        read_only=True,
    )

    class Meta:
        model = Brand

        fields = (
            "id",
            "name",
            "slug",
            "description",
            "logo",
            "is_active",
            "product_count",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "slug",
            "created_at",
            "updated_at",
            "product_count",
        )


class AdminBrandCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Brand

        fields = (
            "name",
            "description",
            "logo",
            "is_active",
        )