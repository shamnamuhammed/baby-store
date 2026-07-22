from drf_spectacular.utils import extend_schema
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from core.response import success_response
from cart.models import Cart, CartItem
from cart.serializers import (
    AddToCartSerializer,CartSerializer,
    CartItemSerializer,
    UpdateCartItemSerializer,
)
from products.models import Product
from django.db.models import F





@extend_schema(
    summary="Add Product to Cart",
    description="Add a product to the authenticated user's shopping cart.",
    request=AddToCartSerializer,
    tags=["Cart"],
)

class AddToCartAPIView(APIView):
    
    permission_classes = [IsAuthenticated]
    
    def post(self,request):
        serializer =AddToCartSerializer(
            data=request.data
        )
        
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status = status.HTTP_400_BAD_REQUEST,
            )
            
        product_id =serializer.validated_data["product"]
        quantity =serializer.validated_data["quantity"]
        
        
        # check product exists
        
        try :
            product =Product.objects.get(
                pk=product_id,
                is_active=True,
            )
        except Product.DoesNotExist:
            return Response(
                {
                    "message": "Product not found."
                },
                status =status.HTTP_404_NOT_FOUND,
            )
            
        # Get or create user's cart
            
        cart,created = Cart.objects.get_or_create(
                user=request.user
            )
            
        #check whether product already exists in cart
            
        try :
                cart_item = CartItem.objects.get(
                    cart =cart,
                    product=product,
                )
                
                cart_item.quantity =F("quantity") + quantity
                cart_item.save()
                
                # Refresh objects so quantity become integer again
                
                cart_item.refresh_from_db()
                
                message =" Cart updated successfully ."
                
        except CartItem.DoesNotExist:
                
                CartItem.objects.create(
                    cart=cart,
                    product=product,
                    quantity=quantity,
                )
                
                message= "Product added to cart successfully ."
        return Response(
                {
                    "message" : message ,
                    
                },
                status =status.HTTP_200_OK
            )
        

@extend_schema(
    summary="View Cart",
    description="Retrieve the authenticated user's shopping cart.",
    tags=["Cart"],
    responses=CartSerializer,
)
class ViewCartAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        try:
            cart = Cart.objects.get(
                user=request.user
            )

        except Cart.DoesNotExist:
            return Response(
                {
                    "message": "Cart not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CartSerializer(cart)

        return Response(
            {
                "message": "Cart retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )
        
        
        
@extend_schema(
    summary="Update Cart Item",
    description="Update the quantity of a cart item for the authenticated user.",
    request=UpdateCartItemSerializer,
    responses=CartItemSerializer,
    tags=["Cart"],
)
class UpdateCartItemAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def put(self, request, pk):
        
        serializer = UpdateCartItemSerializer(
        data=request.data,
)

        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
                )
          
            
        quantity = serializer.validated_data["quantity"]
        
        
        
        try:
            cart_item = CartItem.objects.get(
                pk=pk,
                cart__user=request.user,
            )

        except CartItem.DoesNotExist:
            return Response(
                {
                    "message": "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
          
            
            
        cart_item.quantity = quantity
        cart_item.save()
        
        
        return Response(
            {
                "message": "Cart item updated successfully.",
                "data": CartItemSerializer(cart_item).data,
            },
            status=status.HTTP_200_OK,
        )
        
    def patch(self, request, pk):

        serializer = UpdateCartItemSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        cart_item = CartItem.objects.get(
            pk=pk,
            cart__user=request.user
        )

        cart_item.quantity = serializer.validated_data["quantity"]
        cart_item.save()

        return success_response(
            message="Quantity updated.",
            data=CartItemSerializer(cart_item).data
        )

    put = patch
        
        
@extend_schema(
    summary="Remove Cart Item",
    description="Remove a product from the authenticated user's cart.",
    tags=["Cart"],
)
class RemoveCartItemAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        
        try:
            cart_item = CartItem.objects.get(
                pk=pk,
                cart__user=request.user,
            )

        except CartItem.DoesNotExist:
            return Response(
                {
                    "message": "Cart item not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
        cart_item.delete()
        
        return Response(
            {
                "message": "Cart item removed successfully."
            },
            status=status.HTTP_204_NO_CONTENT,
        )
        
@extend_schema(
    summary="Clear Cart",
    description="Remove all products from the authenticated user's cart.",
    tags=["Cart"],
)
class ClearCartAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            cart = Cart.objects.get(
                user=request.user,
            )

        except Cart.DoesNotExist:
            return Response(
                {
                    "message": "Cart not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
        cart.items.all().delete()
        
        return Response(
                {
                    "message": "Cart cleared successfully."
                },
                status=status.HTTP_200_OK,
            )