from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from addresses.models import Address
from addresses.serializers import AddressSerializer


@extend_schema(
    summary="List Addresses",
    description="Retrieve all addresses of the authenticated user.",
    responses=AddressSerializer(many=True),
    tags=["Addresses"],
)
class ListAddressesAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        addresses = Address.objects.filter(
            user=request.user
        ).order_by("-is_default", "-created_at")

        serializer = AddressSerializer(
            addresses,
            many=True,
        )

        return Response(
            {
                "message": "Addresses retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )