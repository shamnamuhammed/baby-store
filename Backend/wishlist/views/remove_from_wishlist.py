from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from wishlist.models import Wishlist


@extend_schema(
    summary="Remove Wishlist Item",
    description="Remove a product from the authenticated user's wishlist.",
    tags=["Wishlist"],
)

class RemoveFromWishlistAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def delete(self, request, pk):
        
        try:
            wishlist = Wishlist.objects.get(
                pk=pk,
                user=request.user,
            )

        except Wishlist.DoesNotExist:
            return Response(
                {
                    "message": "Wishlist item not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
        wishlist.delete()
        return Response(
                {
                    "message": "Wishlist item removed successfully."
                },
                status=status.HTTP_200_OK,
            )