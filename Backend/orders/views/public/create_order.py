from drf_spectacular.utils import extend_schema
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from core.response import success_response
from rest_framework.views import APIView
from orders.serializers import (
    CreateOrderSerializer,
    OrderSerializer,
)
from orders.services.public import create_order

@extend_schema(
    summary="Create Order",
    description="Create an order from the authenticated user's cart.",
    request=CreateOrderSerializer,
    responses=OrderSerializer,
    tags=["Orders"],
)
class CreateOrderAPIView(APIView):

    permission_classes = [IsAuthenticated]
    
    
    def post(self, request):
        serializer = CreateOrderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        print(request.user)
        print(request.user.id)
        print(request.data)

        try:
            order = create_order(
                user=request.user,
                address_id=serializer.validated_data["address_id"],
            )
            
            return success_response(
                    message="Order placed successfully.",
                    data=OrderSerializer(order).data,
                    status_code=status.HTTP_201_CREATED,
                )
     
        except Exception as e:
            print("ERROR:", type(e), e)
            raise

#       def post(self, request):
        
    #     print("Request Data:", request.data)

    #     serializer = CreateOrderSerializer(data=request.data)
    #     serializer.is_valid(raise_exception=True)

    
    #     order = create_order(
    #         user=request.user,
    #         address_id=serializer.validated_data["address_id"],
    #     )



    #     return success_response(
    #             message="Order placed successfully.",
    #             data=OrderSerializer(order).data,
    #             status_code=status.HTTP_201_CREATED,
    #         )
        
        
    

       
