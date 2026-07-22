from rest_framework.views import APIView
from rest_framework  import status
from rest_framework.permissions import IsAuthenticated
from core.response import success_response
from users.serializers.public.user import UserProfileSerializer
from drf_spectacular.utils import extend_schema



@extend_schema(
    summary="Get User Profile",
    description="Retrieve the profile of the currently logged-in user.",
    tags=["Profile"],
)
class UserProfileAPIView(APIView):
    
    permission_classes= [IsAuthenticated]
    
    
    def get(self,request):
        serializer=UserProfileSerializer(request.user)
        
        return success_response(
            message="Profile retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )
        
    def put(self,request):
        serializer=UserProfileSerializer(
            request.user,
            data=request.data)
        
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return success_response(
            message="Profile updated successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )
        
    def patch(self,request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        return success_response(
        message="Profile updated successfully.",
        data=serializer.data,
        status_code=status.HTTP_200_OK,
    )