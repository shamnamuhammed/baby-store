from rest_framework import serializers

from orders.models import OrderAddress


class AdminOrderAddressSerializer(serializers.ModelSerializer):

    class Meta:
        model = OrderAddress

        fields = (
            "full_name",
            "phone_number",
            "address_line",
            "address_line_2",
            "city",
            "state",
            "postal_code",
            "country",
        )