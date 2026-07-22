from drf_spectacular.utils import extend_schema

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from products.models import Product
from wishlist.models import Wishlist
from wishlist.serializers import AddToWishlistSerializer




@extend_schema(
    summary="Add Product to Wishlist",
    description="Add a product to the authenticated user's wishlist.",
    request=AddToWishlistSerializer,
    tags=["Wishlist"],
)
class AddToWishlistAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        
        serializer = AddToWishlistSerializer(
            data=request.data
        )

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )
            
        product_id = serializer.validated_data["product"]
        
        try:
            product = Product.objects.get(
                pk=product_id,
                is_active=True,
            )

        except Product.DoesNotExist:
            return Response(
                {
                    "message": "Product not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
        wishlist, created = Wishlist.objects.get_or_create(
                        user=request.user,
                        product=product,
                    )
        
        if created:
            message = "Product added to wishlist successfully."
        else:
            message = "Product already exists in wishlist."
            
        return Response(
                    {
                        "message": message,
                    },
                    status=status.HTTP_200_OK,
                )