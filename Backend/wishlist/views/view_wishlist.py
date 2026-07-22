from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wishlist.models import Wishlist
from wishlist.serializers import WishlistSerializer

@extend_schema(
    summary="View Wishlist",
    description="Retrieve the authenticated user's wishlist.",
    responses=WishlistSerializer(many=True),
    tags=["Wishlist"],
)
class ViewWishlistAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def get(self, request):
    
        wishlist = Wishlist.objects.filter(
                    user=request.user,
                ).select_related(
                    "product",
                ).prefetch_related(
                    "product__images",
                )
                
        serializer = WishlistSerializer(
            wishlist,
            many=True,
            )       
        
        return Response(
            {
                "message": "Wishlist retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
                )