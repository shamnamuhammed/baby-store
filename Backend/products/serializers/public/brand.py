from rest_framework import serializers
from products.models import Brand


class BrandSerializer(serializers.ModelSerializer):

    class Meta:
        model = Brand
        fields = (
            "id",
            "name",
            "slug",
            # "logo",
            # "description",
            # "website",
            # "is_active",
        )

        read_only_fields = (
            "id",
            "slug",
        )