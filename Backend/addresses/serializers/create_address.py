from rest_framework import serializers


class CreateAddressSerializer(serializers.Serializer):

    full_name = serializers.CharField(max_length=100)

    phone_number = serializers.CharField(max_length=15)

    address_line_1 = serializers.CharField(max_length=255)

    address_line_2 = serializers.CharField(
        max_length=255,
        required=False,
        allow_blank=True,
    )

    city = serializers.CharField(max_length=100)

    state = serializers.CharField(max_length=100)

    country = serializers.CharField(
        max_length=100,
        default="India",
    )

    postal_code = serializers.CharField(max_length=10)

    is_default = serializers.BooleanField(
        default=False,
    )