from rest_framework import serializers

from wishlist.models import Wishlist
from products.serializers.public import ProductSummarySerializer


class WishlistSerializer(serializers.ModelSerializer):
    product = ProductSummarySerializer(
        read_only=True,
    )
    image = serializers.SerializerMethodField()
    class Meta:
        model = Wishlist
        fields = (
            "id",
            "product",
            "image",
            "created_at",
        )
        
    def get_image(self, obj):
        image = obj.product.images.filter(is_primary=True).first()
        return image.image.url if image else None