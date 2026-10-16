
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.views import APIView

from core.response import success_response
from offers.selectors.public import get_active_public_offers
from offers.serializers.public import PublicOfferSerializer


class PublicOfferListAPIView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        tags=["Public Offers"],
        responses=PublicOfferSerializer(many=True),
    )
    def get(self, request):
        offers = get_active_public_offers()

        serializer = PublicOfferSerializer(
            offers,
            many=True,
        )

        return success_response(
            message="Active offers retrieved successfully.",
            data=serializer.data,
        )
