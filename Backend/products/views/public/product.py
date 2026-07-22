from rest_framework.views import  APIView
from rest_framework.response import Response
from rest_framework import status
from products.models import Product
from products.serializers.public.product import (
    ProductSerializer,
    ProductDetailSerializer,
)
from products.selectors.products import get_products

from core.pagination import CustomPagination
from drf_spectacular.utils import extend_schema


class ProductListCreateAPIView(APIView):
    
    @extend_schema(
    summary="List Products",
    description="Retrieve all active products. Supports searching by product name using the 'search' query parameter.",
    tags=["Products"],
    responses=ProductDetailSerializer(many=True),
     )
    def get(self, request):
        
        products = get_products(
            request,
            queryset=Product.objects.filter(
                is_active=True
            )
        )

        #pagination
        pagination = CustomPagination()
                
        page = pagination.paginate_queryset(
                products,
                request
                        )

        serializer = ProductDetailSerializer(
                page,
                many=True,
            )
        
        

        return pagination.get_paginated_response(
                    serializer.data
                )

    @extend_schema(
        summary="Create Product",
        description="Create a new product.",
        request=ProductSerializer,
        responses=ProductDetailSerializer,
        tags=["Products"]
    )
    def post(self, request):

        serializer = ProductSerializer(
            data=request.data
        )

        if serializer.is_valid():

            serializer.save()

            product = Product.objects.get(
                id=serializer.instance.id
            )

            return Response(
                {
                    "message": "Product created successfully.",
                    "data": ProductDetailSerializer(product).data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )
        
        
class ProductDetailAPIView(APIView):
    def get_object(self, pk):
        
        try:
            return Product.objects.get(pk=pk)
        except Product.DoesNotExist:
            return None
        
    
    @extend_schema(
    summary="Retrieve Product",
    description="Retrieve a single product by its ID.",
    tags=["Products"],
    responses=ProductDetailSerializer,
)
    def get(self,request,pk):
        
        product = self.get_object(pk)
        
        
        if not product:
            return Response(
                {"message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

          
        serializer = ProductDetailSerializer(product)
          
        return Response(
              {
                    "message": "Product retrieved successfully.",
                    "data": serializer.data,
                },
              status=status.HTTP_200_OK
          )
        
            
            
    @extend_schema(
    summary="Update Product",
    description="Update an existing product.",
    tags=["Products"],
    request=ProductSerializer,
    responses=ProductDetailSerializer,
)      
    def put(self,request,pk):
        product = self.get_object(pk)

        if not product:
            return Response(
                {"message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )
            
        serializer=ProductSerializer(
                product,
                data=request.data)
            
        if serializer.is_valid():
                serializer.save()
                
                
                # updated_product = Product.objects.get(pk=pk)
                
                
                return Response(
                    {
                        "message": "Product updated successfully.",
                        "data": ProductDetailSerializer(product).data
                    },
                    status=status.HTTP_200_OK
                )
        return Response(
                serializer.errors,
                status =status.HTTP_400_BAD_REQUEST
            )
        
        
    @extend_schema(
    summary="Delete Product",
    description="Delete a product by its ID.",
    tags=["Products"],
)   
    def delete(self, request, pk):

        product = self.get_object(pk)

        if not product:
            return Response(
                {"message": "Product not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        product.delete()

        return Response(
            {
                "message": "Product deleted successfully.",
            },
            status=status.HTTP_204_NO_CONTENT,
        )
            
        