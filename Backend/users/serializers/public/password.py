from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True
    )

    new_password = serializers.CharField(
        write_only=True
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    def validate(self, attrs):
        old_password = attrs["old_password"]
        new_password = attrs["new_password"]
        confirm_password = attrs["confirm_password"]

        if new_password != confirm_password:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        if old_password == new_password:
            raise serializers.ValidationError({
                "new_password":
                    "New password must be different from the old password."
            })

        # Apply Django password validators
        user = self.context["request"].user

        validate_password(
            new_password,
            user=user,
        )

        return attrs