from rest_framework import serializers


class RefundPaymentSerializer(serializers.Serializer):

    reason = serializers.CharField(
        max_length=500,
    )