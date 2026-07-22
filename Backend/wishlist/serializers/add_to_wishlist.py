from rest_framework import serializers


class AddToWishlistSerializer(serializers.Serializer):
    """
    Serializer for adding a product to the wishlist.
    """

    product = serializers.IntegerField()