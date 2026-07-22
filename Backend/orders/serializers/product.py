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
        primary = obj.images.filter(is_primary=True).first()

        if primary:
            return primary.image.url
        return None