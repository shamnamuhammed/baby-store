from rest_framework import serializers


class UpdateCartItemSerializer(serializers.Serializer):
    """
    Serializer for updating the quantity of a cart item.
    """

    quantity = serializers.IntegerField(
        min_value=1,
    )