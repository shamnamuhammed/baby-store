from rest_framework import serializers

from products.models import ProductImage


class AdminProductImageSerializer(serializers.ModelSerializer):

    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage

        fields = (
            "id",
            "product",
            "image",
            "image_url",
            "alt_text",
            "is_primary",
            "created_at",
        )

        read_only_fields = (
            "id",
            "created_at",
        )

    def get_image_url(self, obj):

        request = self.context.get("request")

        if obj.image and request:

            return request.build_absolute_uri(
                obj.image.url
            )

        return None