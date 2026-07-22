from django.db import transaction

from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from addresses.models import Address
from addresses.serializers import (
    AddressSerializer,
    UpdateAddressSerializer,
)

@extend_schema(
    summary="Update Address",
    description="Update an address of the authenticated user.",
    request=UpdateAddressSerializer,
    responses=AddressSerializer,
    tags=["Addresses"],
)
class UpdateAddressAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        
        try:
            address = Address.objects.get(
                pk=pk,
                user=request.user,
            )

        except Address.DoesNotExist:
            return Response(
                {
                    "message": "Address not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )
            
        serializer = UpdateAddressSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        
        with transaction.atomic():

            if data.get("is_default"):

                Address.objects.filter(
                    user=request.user,
                    is_default=True,
                ).exclude(
                    pk=address.pk,
                ).update(
                    is_default=False,
                )

            for field, value in data.items():
                setattr(address, field, value)

            address.save()
            
        return Response(
            {
                "message": "Address updated successfully.",
                "data": AddressSerializer(address).data,
            },
            status=status.HTTP_200_OK,
        )