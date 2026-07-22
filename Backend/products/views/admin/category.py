from rest_framework.views import APIView
from rest_framework import status
from core.swagger import ValidationErrorSerializer,ErrorSerializer
from drf_spectacular.utils import extend_schema

from core.pagination import CustomPagination
from core.response import success_response

from core.permission import IsAdmin

from products.serializers.admin.category import (
    AdminCategorySerializer,
    AdminCategoryCreateSerializer,
)

from products.selectors.admin import (
    get_admin_categories,
    get_admin_category_by_id,
)

from products.services.admin.category import (
    create_category,
    update_category,
    delete_category,
)


class AdminCategoryListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List Categories",
        description="Retrieve all categories for the admin dashboard.",
        tags=["Admin Categories"],
        responses={
            200:AdminCategorySerializer(many=True),
        }
    )
    def get(self, request):

        categories = get_admin_categories()

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            categories,
            request,
        )

        serializer = AdminCategorySerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data
        )

    @extend_schema(
        summary="Create Category",
        description="Create a new category.",
        tags=["Admin Categories"],
        request=AdminCategoryCreateSerializer,
        responses={
        201: AdminCategorySerializer,
        400: ValidationErrorSerializer,
    },
    )
    def post(self, request):

        serializer = AdminCategoryCreateSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        category = create_category(
            validated_data=serializer.validated_data
        )

        return success_response(
            message="Category created successfully.",
            data=AdminCategorySerializer(category).data,
            status_code=status.HTTP_201_CREATED,
        )


class AdminCategoryDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Categories"],
        responses=AdminCategorySerializer,
    )
    def get(self, request, pk):

        category = get_admin_category_by_id(
            category_id=pk,
        )

        return success_response(
            message="Category retrieved successfully.",
            data=AdminCategorySerializer(category).data,
        )

    @extend_schema(
    summary="Update Category",
    description="Update an existing category.",
    tags=["Admin Categories"],
    request=AdminCategoryCreateSerializer,
    responses={
        200: AdminCategorySerializer,
        400: ValidationErrorSerializer,
        404: ErrorSerializer,
    # },
    },)
    def put(self, request, pk):

        category = get_admin_category_by_id(
            category_id=pk,
        )

        serializer = AdminCategoryCreateSerializer(
            category,
            data=request.data,
        )

        serializer.is_valid(
            raise_exception=True
        )

        category = update_category(
            category=category,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Category updated successfully.",
            data=AdminCategorySerializer(category).data,
        )

    @extend_schema(
    summary="Partial Update Category",
    description="Partially update a category.",
    tags=["Admin Categories"],
    request=AdminCategoryCreateSerializer,
    responses={
        200: AdminCategorySerializer,
        400: ValidationErrorSerializer,
        404: ErrorSerializer,
    },)
    
    def patch(self, request, pk):

        category = get_admin_category_by_id(
            category_id=pk,
        )

        serializer = AdminCategoryCreateSerializer(
            category,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True
        )

        category = update_category(
            category=category,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Category updated successfully.",
            data=AdminCategorySerializer(category).data,
        )

    @extend_schema(
            summary="Delete Category",
            description="Delete a category.",
            tags=["Admin Categories"],
            responses={
                204: None,
                404: ErrorSerializer,
            },
    )
    def delete(self, request, pk):

        category = get_admin_category_by_id(
            category_id=pk,
        )

        delete_category(
            category=category,
        )

        return success_response(
            message="Category deleted successfully.",
            status_code=status.HTTP_204_NO_CONTENT,
        )