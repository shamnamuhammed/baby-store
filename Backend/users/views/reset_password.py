from django.contrib.auth import get_user_model
from users.services.public import reset_password
from rest_framework.views import APIView
from core.response import success_response
from rest_framework import status
from drf_spectacular.utils import extend_schema
from users.serializers.public.reset_password import ResetPasswordSerializer
from rest_framework.exceptions import ValidationError

User= get_user_model()


@extend_schema(
    summary="Reset Password",
    description="Reset the user's password using the reset token.",
    tags=["Authentication"],
)
class ResetPasswordAPIView(APIView):
    
    def post(self,request):
        serializer =ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        
        
        reset_password(
            uid=serializer.validated_data["uid"],
            token=serializer.validated_data["token"],
            new_password=serializer.validated_data["new_password"],
        )
        
        return success_response(
            message="Password reset successfully.",
            status_code=status.HTTP_200_OK,
        )