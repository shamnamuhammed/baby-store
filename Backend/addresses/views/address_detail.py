from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from addresses.models import Address
from addresses.serializers import AddressSerializer

@extend_schema(
    summary="Address Detail",
    description="Retrieve a single address of the authenticated user.",
    responses=AddressSerializer,
    tags=["Addresses"],
)
class AddressDetailAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

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

        serializer = AddressSerializer(address)

        return Response(
            {
                "message": "Address retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )