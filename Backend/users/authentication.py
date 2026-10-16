from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.middleware.csrf import CsrfViewMiddleware, get_token
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from rest_framework.exceptions import PermissionDenied

User = get_user_model()


class EmailBackend(ModelBackend):
    """
    Authenticate users using email instead of username.
    """

    def authenticate(
        self,
        request,
        username=None,
        email=None,
        password=None,
        **kwargs,
    ):
        if email is None:
            email = username

        if email is None or password is None:
            return None

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            return None

        if (
            user.check_password(password)
            and self.user_can_authenticate(user)
        ):
            return user
        

        return None


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticate users using the JWT stored in the HttpOnly access-token
    cookie and enforce CSRF protection for unsafe HTTP methods.
    """

    def authenticate(self, request):
        raw_token = request.COOKIES.get("access_token")

        print("========== JWT DEBUG ==========")
        print("ACCESS TOKEN EXISTS:", bool(raw_token))
        print("COOKIE KEYS:", list(request.COOKIES.keys()))

        if raw_token is None:
            print("NO ACCESS TOKEN")
            return None

        try:
            validated_token = self.get_validated_token(raw_token)
            user = self.get_user(validated_token)

            print("AUTHENTICATED USER:", user)
            print("USER ID:", user.id)

            # CSRF protection for cookie-based authentication.
            self.enforce_csrf(request)

            return user, validated_token

        except InvalidToken as e:
            print("INVALID JWT:", e)

            return None

    def enforce_csrf(self, request):
        """
        Enforce Django CSRF validation for authenticated
        cookie-based JWT requests.
        """

        # Safe HTTP methods do not modify server state.
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return

        csrf_check = CsrfViewMiddleware(lambda request: None)

        csrf_check.process_request(request)

        reason = csrf_check.process_view(
            request,
            lambda request: None,
            (),
            {},
        )

        if reason:
            raise PermissionDenied(
                "CSRF validation failed."
            )