from rest_framework import serializers

from users.models import User


class AdminUserSerializer(serializers.ModelSerializer):

    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User

        fields = (
            "id",
            "username",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone_number",
            "profile_image",
            "gender",
            "date_of_birth",
            "is_active",
            "is_staff",
            "is_verified",
            "created_at",
            "updated_at",
        )

        read_only_fields = (
            "id",
            "created_at",
            "updated_at",
        )

    def get_full_name(self, obj):
        return obj.get_full_name()


class AdminUserUpdateSerializer(serializers.ModelSerializer):

    class Meta:
        model = User

        fields = (
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "is_verified",
            "is_active",
        )