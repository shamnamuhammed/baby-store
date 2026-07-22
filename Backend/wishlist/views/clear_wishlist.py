from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wishlist.models import Wishlist

@extend_schema(
    summary="Clear Wishlist",
    description="Remove all products from the authenticated user's wishlist.",
    tags=["Wishlist"],
)

class ClearWishlistAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def delete(self, request):
        
        Wishlist.objects.filter(
            user=request.user,
            ).delete()
        
        return Response(
            {
                "message": "Wishlist cleared successfully."
            },
            status=status.HTTP_200_OK,
            )