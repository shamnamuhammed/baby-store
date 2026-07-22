from rest_framework import serializers

from products.models import Product


class ProductSummarySerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "price",
            "discount_price",
            "image",
        )

    def get_image(self, obj):
        image = obj.images.filter(
            is_primary=True,
        ).first() or obj.images.first()

        if image:
            return image.image.url

        return None