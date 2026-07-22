from django.db import transaction

from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from addresses.models import Address


@extend_schema(
    summary="Delete Address",
    description="Delete an address of the authenticated user.",
    tags=["Addresses"],
)
class DeleteAddressAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):

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

        with transaction.atomic():

            was_default = address.is_default

            address.delete()

            if was_default:

                new_default = Address.objects.filter(
                    user=request.user,
                ).first()

                if new_default:
                    new_default.is_default = True
                    new_default.save()

        return Response(
            {
                "message": "Address deleted successfully."
            },
            status=status.HTTP_200_OK,
        )