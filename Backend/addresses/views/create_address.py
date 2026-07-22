from django.db import transaction

from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from addresses.models import Address
from addresses.serializers import CreateAddressSerializer

from django.db import transaction
import traceback

@extend_schema(
    summary="Create Address",
    description="Create a new address for the authenticated user.",
    request=CreateAddressSerializer,
    tags=["Addresses"],
)
# class CreateAddressAPIView(APIView):

#     permission_classes = [IsAuthenticated]

#     def post(self, request):
        
#         serializer = CreateAddressSerializer(
#         data=request.data,
#         )

#         serializer.is_valid(raise_exception=True)

        
#         data = serializer.validated_data
#         with transaction.atomic():

#             if data["is_default"]:

#                 Address.objects.filter(
#                     user=request.user,
#                     is_default=True,
#                 ).update(
#                     is_default=False,
#                 )

#             address = Address.objects.create(
#                 user=request.user,
#                 **data,
#             )
            
#         return Response(
#             {
#                 "message": "Address created successfully.",
#                 "data": {
#                     "id": address.id,
#                 },
#             },
#             status=status.HTTP_201_CREATED,
#         )



class CreateAddressAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            serializer = CreateAddressSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            data = serializer.validated_data

            with transaction.atomic():

                if data["is_default"]:
                    Address.objects.filter(
                        user=request.user,
                        is_default=True,
                    ).update(is_default=False)

                address = Address.objects.create(
                    user=request.user,
                    **data,
                )

            return Response(
                {
                    "message": "Address created successfully.",
                    "data": {"id": address.id},
                },
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            traceback.print_exc()      # <-- prints the full error in the terminal
            raise e