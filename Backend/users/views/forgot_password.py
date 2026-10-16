from rest_framework.views import APIView
from rest_framework import status

from users.serializers.public.forgot_password import (
    ForgotPasswordSerializer,
)

from users.services.public import forgot_password
from core.throttles import ForgotPasswordRateThrottle
from core.response import success_response
from rest_framework.permissions import AllowAny

from drf_spectacular.utils import extend_schema


@extend_schema(
    summary="Forgot Password",
    description="Send a password reset link to the user's email.",
    tags=["Authentication"],
)
class ForgotPasswordAPIView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]
    throttle_classes = [ForgotPasswordRateThrottle]

    def post(self, request):

        serializer = ForgotPasswordSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        forgot_password(
            serializer.validated_data["email"]
        )

        return success_response(
            message=(
                "If an account exists for this email, "
                "a password reset link has been sent."
            ),
            data={},
            status_code=status.HTTP_200_OK,
        )