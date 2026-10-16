
from rest_framework import serializers

from products.models import Product


class OrderProductSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "image",
        )

    def get_image(self, obj):
        images = list(obj.images.all())

        if not images:
            return None

        selected_image = next(
            (image for image in images if image.is_primary),
            images[0],
        )

        if not selected_image.image:
            return None

        try:
            return selected_image.image.url
        except ValueError:
            return None
