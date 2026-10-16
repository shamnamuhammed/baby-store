from django.contrib.auth import get_user_model
from django.contrib.auth import authenticate
from django.contrib.auth.tokens import default_token_generator

from django.utils.encoding import force_bytes
from django.utils.http import (
    urlsafe_base64_decode,
    urlsafe_base64_encode,
)
from django.utils.encoding import force_str

from rest_framework.exceptions import AuthenticationFailed

from rest_framework_simplejwt.tokens import RefreshToken

from notifications.tasks import (
    send_welcome_email_task,
    send_reset_password_email_task,
)

from users.selectors.public import get_user_by_email


User = get_user_model()


def register_user(validated_data):
    validated_data.pop(
        "confirm_password",
        None,
    )

    user = User.objects.create_user(
        **validated_data
    )

    send_welcome_email_task.delay(
        user.id
    )

    return user


def login_user(email, password):
    """
    Authenticate user and generate JWT tokens.
    """

    user = authenticate(
        email=email,
        password=password,
    )

    if not user:
        raise AuthenticationFailed(
            "Invalid email or password."
        )

    refresh = RefreshToken.for_user(user)

    return {
        "user": user,
        "access": str(refresh.access_token),
        "refresh": str(refresh),
    }


def change_password(
    user,
    old_password,
    new_password,
):
    """
    Change the password of an authenticated user.
    """

    if not user.check_password(old_password):
        raise AuthenticationFailed(
            "Old password is incorrect."
        )

    user.set_password(
        new_password
    )

    user.save(
        update_fields=["password"]
    )

    return user


def forgot_password(email):
    """
    Generate password reset token and send reset email.

    The caller should receive the same response
    whether or not the email exists.
    """

    user = get_user_by_email(email)

    if user:
        uid = urlsafe_base64_encode(
            force_bytes(user.pk)
        )

        token = default_token_generator.make_token(
            user
        )

        send_reset_password_email_task.delay(
            user.id,
            uid,
            token,
        )

    return {}


def reset_password(
    uid,
    token,
    new_password,
):
    """
    Reset user password using uid and
    Django's password-reset token.
    """

    try:
        user_id = force_str(
            urlsafe_base64_decode(uid)
        )

        user = User.objects.get(
            pk=user_id
        )

    except (
        ValueError,
        TypeError,
        OverflowError,
        User.DoesNotExist,
    ):
        raise AuthenticationFailed(
            "Invalid reset link."
        )

    if not default_token_generator.check_token(
        user,
        token,
    ):
        raise AuthenticationFailed(
            "Invalid or expired token."
        )

    user.set_password(
        new_password
    )

    user.save(
        update_fields=["password"]
    )

    return user