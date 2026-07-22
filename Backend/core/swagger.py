from rest_framework import serializers


class SuccessSerializer(serializers.Serializer):
    success = serializers.BooleanField(
        default=True
    )

    message = serializers.CharField()

    data = serializers.JSONField(
        required=False,
        allow_null=True,
    )


class ErrorSerializer(serializers.Serializer):
    success = serializers.BooleanField(
        default=False
    )

    message = serializers.CharField()


class ValidationErrorSerializer(serializers.Serializer):
    success = serializers.BooleanField(
        default=False
    )

    message = serializers.CharField(
        default="Validation Failed"
    )

    errors = serializers.DictField()