from django.conf import settings

from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from core.response import success_response


class LogoutAPIView(APIView):

    permission_classes = [AllowAny]

    def post(self, request):

        refresh_token = request.COOKIES.get("refresh_token")

        if refresh_token:
            try:
                token = RefreshToken(refresh_token)
                token.blacklist()
            except TokenError:
                pass

        response = success_response(
            message="Logged out successfully.",
            status_code=status.HTTP_200_OK,
        )

        response.delete_cookie(
            "access_token",
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )

        response.delete_cookie(
            "refresh_token",
            samesite=settings.AUTH_COOKIE_SAMESITE,
        )

        return response