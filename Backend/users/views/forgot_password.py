
from rest_framework.views import APIView
from users.serializers.public.forgot_password import ForgotPasswordSerializer
from core.response import success_response
from rest_framework import status
from users.serializers.public.forgot_password import (
    ForgotPasswordSerializer,)
from users.services.public import forgot_password
from drf_spectacular.utils import extend_schema



@extend_schema(
    summary="Forgot Password",
    description="Send a password reset link to the user's email.",
    tags=["Authentication"],
)
class ForgotPasswordAPIView(APIView):
    def post(self,request):
        serializer =ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        result = forgot_password(
                    serializer.validated_data["email"],
                )
        
        return success_response(
            message="Password reset link sent to your email.",
            data=result,
            status_code=status.HTTP_200_OK,
        )