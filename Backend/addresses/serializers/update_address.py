from rest_framework import serializers


class UpdateAddressSerializer(serializers.Serializer):

    full_name = serializers.CharField(
        max_length=100,
        required=False,
    )

    phone_number = serializers.CharField(
        max_length=15,
        required=False,
    )

    address_line_1 = serializers.CharField(
        max_length=255,
        required=False,
    )

    address_line_2 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
    )

    city = serializers.CharField(
        max_length=100,
        required=False,
    )

    state = serializers.CharField(
        max_length=100,
        required=False,
    )

    country = serializers.CharField(
        max_length=100,
        required=False,
    )

    postal_code = serializers.CharField(
        max_length=10,
        required=False,
    )

    is_default = serializers.BooleanField(
        required=False,
    )