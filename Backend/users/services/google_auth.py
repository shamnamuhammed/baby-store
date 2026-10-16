from django.conf import settings
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.tokens import RefreshToken
from cart.models import Cart
from google.oauth2 import id_token
from google.auth.transport import requests


User = get_user_model()


class GoogleAuthService:

    @staticmethod
    def authenticate(*, token):

        # 1. Verify Google ID token
        try:
            google_data = id_token.verify_oauth2_token(
                token,
                requests.Request(),
                audience=settings.GOOGLE_CLIENT_ID,
            )

        except ValueError:
            raise AuthenticationFailed(
                "Invalid Google token."
            )

        # 2. Get email
        email = google_data.get("email")

        if not email:
            raise AuthenticationFailed(
                "Google account email not available."
            )

        # 3. Check whether Google verified the email
        if not google_data.get("email_verified"):
            raise AuthenticationFailed(
                "Google email is not verified."
            )

        # 4. Get Google profile information
        first_name = google_data.get(
            "given_name",
            "",
        )

        last_name = google_data.get(
            "family_name",
            "",
        )

        # 5. Find existing user
        user = User.objects.filter(
            email__iexact=email
        ).first()

        # 6. Create user if it doesn't exist
        if user is None:

            user = User.objects.create_user(
                username=email,
                email=email,
                first_name=first_name,
                last_name=last_name,
                is_verified=True,
            )
        Cart.objects.get_or_create(user=user)

        # 7. Check whether account is active
        if not user.is_active:
            raise AuthenticationFailed(
                "This account is blocked."
            )

        # 8. Mark Google verified user
        if not user.is_verified:
            user.is_verified = True
            user.save(
                update_fields=["is_verified"]
            )

        # 9. Generate your existing JWT
        refresh = RefreshToken.for_user(user)

        return {
            "user": user,
            "access": str(refresh.access_token),
            "refresh": str(refresh),
        }