from rest_framework.views import APIView
from core.permission import IsAdmin

from products.selectors.admin import get_admin_products
from products.serializers.admin.product import (
    AdminProductSerializer , AdminProductCreateSerializer)
from core.pagination import CustomPagination
from core.response import success_response
from rest_framework.response import Response
from rest_framework import status
from products.services.admin.product import (
    create_product ,update_product,delete_product)
from products.selectors.admin import get_admin_product_by_id


from drf_spectacular.utils import extend_schema



class AdminProductListAPIView(APIView):

    permission_classes = [IsAdmin]



    @extend_schema(
        summary="List Products",
        description="Retrieve all products for the admin dashboard.",
        tags=["Admin Products"],
        responses=AdminProductSerializer(many=True),
    )

    def get(self, request):
        
    

        products = get_admin_products()

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            products,
            request,
        )

        serializer = AdminProductSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )
        
     
    @extend_schema(
        summary="Create Product",
        description="Create a new product.",
        tags=["Admin Products"],
        request=AdminProductCreateSerializer,
        responses={
            201: AdminProductSerializer,
        },
    )

  
    def post(self, request):

        serializer = AdminProductCreateSerializer(
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        product = create_product(
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Product created successfully.",
            data=AdminProductSerializer(product).data,
            status_code=status.HTTP_201_CREATED,
        )
        
        
class AdminProductDetailAPIView(APIView):

    permission_classes = [IsAdmin]


    @extend_schema(
        summary="Retrieve Product",
        description="Retrieve a single product by ID.",
        tags=["Admin Products"],
        responses=AdminProductSerializer,
    )
    def get(self, request, pk):

        product = get_admin_product_by_id(
            product_id=pk,
        )

        serializer = AdminProductSerializer(product)

        return success_response(
            message="Product retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )
    @extend_schema(
        summary="Update Product",
        description="Update an existing product.",
        tags=["Admin Products"],
        request=AdminProductCreateSerializer,
        responses= {
        201:AdminProductSerializer,}
        )
    def put(self, request, pk):

        product = get_admin_product_by_id(
            product_id=pk,
        )

        serializer = AdminProductCreateSerializer(
            product,
            data=request.data,
        )

        serializer.is_valid(raise_exception=True)

        product = update_product(
            product=product,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Product updated successfully.",
            data=AdminProductSerializer(product).data,
            status_code=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Partial Update Product",
        description="Partially update an existing product.",
        tags=["Admin Products"],
        request=AdminProductCreateSerializer,
        responses=AdminProductSerializer,
    )
    def patch(self, request, pk):

        product = get_admin_product_by_id(
            product_id=pk,
        )

        serializer = AdminProductCreateSerializer(
            product,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(raise_exception=True)

        product = update_product(
            product=product,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="Product updated successfully.",
            data=AdminProductSerializer(product).data,
            status_code=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Delete Product",
        description="Delete a product.",
        tags=["Admin Products"],
        responses={204: None},
    )
    def delete(self, request, pk):

        product = get_admin_product_by_id(
            product_id=pk,
        )

        delete_product(product=product)

        return success_response(
            message="Product deleted successfully.",
            status_code=status.HTTP_204_NO_CONTENT,
        )
