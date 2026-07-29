from drf_spectacular.utils import extend_schema

from rest_framework.views import APIView

from core.permission import IsAdmin
from core.pagination import CustomPagination
from core.response import success_response

from offers.selectors.admin import (
    get_all_offers,
    get_offer_by_id,
)

from offers.serializers.admin import (
    OfferSerializer,
    CreateOfferSerializer,
    UpdateOfferSerializer,
)

from offers.services.admin import (
    create_offer,
    update_offer,
    delete_offer,
    activate_offer,
    deactivate_offer,
)


class AdminOfferListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Offers"],
        responses=OfferSerializer(many=True),
    )
    def get(self, request):

        offers = get_all_offers()

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            offers,
            request,
        )

        serializer = OfferSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )

    @extend_schema(
        tags=["Admin Offers"],
        request=CreateOfferSerializer,
        responses=OfferSerializer,
    )
    def post(self, request):

        serializer = CreateOfferSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        offer = create_offer(
            data=serializer.validated_data,
        )

        return success_response(
            message="Offer created successfully.",
            data=OfferSerializer(offer).data,
        )


class AdminOfferDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Offers"],
        responses=OfferSerializer,
    )
    def get(self, request, pk):

        offer = get_offer_by_id(
            offer_id=pk,
        )

        return success_response(
            message="Offer retrieved successfully.",
            data=OfferSerializer(offer).data,
        )

    @extend_schema(
        tags=["Admin Offers"],
        request=UpdateOfferSerializer,
        responses=OfferSerializer,
    )
    def patch(self, request, pk):

        offer = get_offer_by_id(
            offer_id=pk,
        )

        serializer = UpdateOfferSerializer(
            offer,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        offer = update_offer(
            offer=offer,
            data=serializer.validated_data,
        )

        return success_response(
            message="Offer updated successfully.",
            data=OfferSerializer(offer).data,
        )

    @extend_schema(
        tags=["Admin Offers"],
    )
    def delete(self, request, pk):

        offer = get_offer_by_id(
            offer_id=pk,
        )

        delete_offer(
            offer=offer,
        )

        return success_response(
            message="Offer deleted successfully.",
        )


class ActivateOfferAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Offers"],
        responses=OfferSerializer,
    )
    def patch(self, request, pk):

        offer = get_offer_by_id(
            offer_id=pk,
        )

        offer = activate_offer(
            offer=offer,
        )

        return success_response(
            message="Offer activated successfully.",
            data=OfferSerializer(offer).data,
        )


class DeactivateOfferAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Offers"],
        responses=OfferSerializer,
    )
    def patch(self, request, pk):

        offer = get_offer_by_id(
            offer_id=pk,
        )

        offer = deactivate_offer(
            offer=offer,
        )

        return success_response(
            message="Offer deactivated successfully.",
            data=OfferSerializer(offer).data,
        )