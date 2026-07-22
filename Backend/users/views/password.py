from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from core.response import success_response
from rest_framework import status
from users.serializers.public.password import ChangePasswordSerializer
from drf_spectacular.utils import extend_schema
from users.services.public import change_password


@extend_schema(
    summary="Change Password",
    description="Change the password of the authenticated user.",
    tags=["Authentication"],
)
class ChangePasswordAPIView(APIView):
    permission_classes = [IsAuthenticated]
    
    def post(self,request):
        serializer=ChangePasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        
        change_password(
            user=request.user,
            old_password=serializer.validated_data["old_password"],
            new_password=serializer.validated_data["new_password"],
        )

            

        
        return success_response(
            message="Password changed successfully.",
            status_code=status.HTTP_200_OK,
        )