from rest_framework.views import APIView
from rest_framework import status

from drf_spectacular.utils import extend_schema

from core.permission import IsAdmin

from core.pagination import CustomPagination
from core.response import success_response
from core.swagger import (
    SuccessSerializer,
    ErrorSerializer,
    ValidationErrorSerializer,
)

from products.serializers.admin.brand import (
    AdminBrandSerializer,
    AdminBrandCreateSerializer,
)

from products.selectors.admin import (
    get_admin_brands,
    get_admin_brand_by_id,
)

from products.services.admin.brand import (
    create_brand,
    update_brand,
    delete_brand,
)


class AdminBrandListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List Brands",
        description="Retrieve all brands.",
        tags=["Admin Brands"],
        responses={
            200: AdminBrandSerializer(many=True),
        },
    )
    def get(self, request):

        brands = get_admin_brands()

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            brands,
            request,
        )

        serializer = AdminBrandSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    @extend_schema(
        summary="Create Brand",
        description="Create a new brand.",
        tags=["Admin Brands"],
        request=AdminBrandCreateSerializer,
        responses={
            201: SuccessSerializer,
            400: ValidationErrorSerializer,
        },
    )
    def post(self, request):

        serializer = AdminBrandCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        brand = create_brand(
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Brand created successfully.",
            data=AdminBrandSerializer(brand).data,
            status_code=status.HTTP_201_CREATED,
        )


class AdminBrandDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Retrieve Brand",
        description="Retrieve a single brand.",
        tags=["Admin Brands"],
        responses={
            200: AdminBrandSerializer,
            404: ErrorSerializer,
        },
    )
    def get(self, request, pk):

        brand = get_admin_brand_by_id(
            brand_id=pk,
        )

        return success_response(
            message="Brand retrieved successfully.",
            data=AdminBrandSerializer(brand).data,
        )

    @extend_schema(
        summary="Update Brand",
        description="Update a brand.",
        tags=["Admin Brands"],
        request=AdminBrandCreateSerializer,
        responses={
            200: SuccessSerializer,
            400: ValidationErrorSerializer,
            404: ErrorSerializer,
        },
    )
    def put(self, request, pk):

        brand = get_admin_brand_by_id(
            brand_id=pk,
        )

        serializer = AdminBrandCreateSerializer(
            brand,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        brand = update_brand(
            brand=brand,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Brand updated successfully.",
            data=AdminBrandSerializer(brand).data,
        )

    @extend_schema(
        summary="Partial Update Brand",
        description="Partially update a brand.",
        tags=["Admin Brands"],
        request=AdminBrandCreateSerializer,
        responses={
            200: SuccessSerializer,
            400: ValidationErrorSerializer,
            404: ErrorSerializer,
        },
    )
    def patch(self, request, pk):

        brand = get_admin_brand_by_id(
            brand_id=pk,
        )

        serializer = AdminBrandCreateSerializer(
            brand,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        brand = update_brand(
            brand=brand,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Brand updated successfully.",
            data=AdminBrandSerializer(brand).data,
        )

    @extend_schema(
        summary="Delete Brand",
        description="Delete a brand.",
        tags=["Admin Brands"],
        responses={
            204: None,
            404: ErrorSerializer,
        },
    )
    def delete(self, request, pk):

        brand = get_admin_brand_by_id(
            brand_id=pk,
        )

        delete_brand(
            brand=brand,
        )

        return success_response(
            message="Brand deleted successfully.",
            status_code=status.HTTP_204_NO_CONTENT,
        )