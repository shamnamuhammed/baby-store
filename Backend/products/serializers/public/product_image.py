from rest_framework import serializers

from products.models import ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = (
            "id",
            "image",
            "image_url",
            "alt_text",
            "is_primary",
        )
        read_only_fields = ("id", "image_url")

    def get_image_url(self, obj):
        if not obj.image:
            return None

        try:
            image_path = obj.image.url
        except (ValueError, AttributeError):
            return None

        request = self.context.get("request")

        if request:
            return request.build_absolute_uri(image_path)

        return image_path
# from rest_framework import serializers
# from products.models import ProductImage


# class ProductImageSerializer(serializers.ModelSerializer):

#     class Meta:
#         model = ProductImage
#         fields = (
#             "id",
#             "image",
#             "alt_text",
#             "is_primary",
#         )
#         read_only_fields = ("id",)