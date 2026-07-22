from rest_framework import serializers


class AddToCartSerializer(serializers.Serializer):
    """
    Serializer for adding a product to the cart.
    """

    product = serializers.IntegerField()
    
    quantity = serializers.IntegerField(
        min_value=1,
        default=1,
    )