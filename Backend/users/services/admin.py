from users.models import User
from rest_framework.exceptions import ValidationError

def update_user(*, user, validated_data):

    for attr, value in validated_data.items():
        setattr(
            user,
            attr,
            value,
        )

    user.save()

    return user


def block_user(*, user):

    user.is_active = False

    user.save(
        update_fields=[
            "is_active",
        ]
    )
    if user.is_superuser:
        raise ValidationError(
            "Superuser cannot be blocked."
        )

    return user


def unblock_user(*, user):

    user.is_active = True

    user.save(
        update_fields=[
            "is_active",
        ]
    )

    return user


def delete_user(*, user):
    if user.is_superuser:
        raise ValidationError(
            "Superuser cannot be deleted."
        )

    user.delete()
