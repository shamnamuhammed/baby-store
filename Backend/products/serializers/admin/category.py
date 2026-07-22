from rest_framework import serializers

from products.models import Category


class AdminCategorySerializer(serializers.ModelSerializer):

    product_count = serializers.IntegerField(
        source="products.count",
        read_only=True,
    )

    class Meta:
        model = Category

        fields = (
            "id",
            "name",
            "slug",
            "description",
            "image",
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


class AdminCategoryCreateSerializer(serializers.ModelSerializer):

    class Meta:
        model = Category

        fields = (
            "name",
            "description",
            "image",
            "is_active",
        )