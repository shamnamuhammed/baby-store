
from rest_framework import serializers


class AdminRejectRefundSerializer(serializers.Serializer):
    reason = serializers.CharField(
        max_length=500,
        allow_blank=False,
        trim_whitespace=True,
    )
