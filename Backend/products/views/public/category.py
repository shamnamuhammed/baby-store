from products.models import Category
from products.serializers.public.category import CategorySerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema


@extend_schema(
    summary="List Categories",
    description="Retrieve all categories.",
    tags=["Category"],
)

class CategoryListCreateAPIView(APIView):
    
    def get(self,request):
        categories =Category.objects.all()
        
        serializer =CategorySerializer(categories,many=True)
        
        return Response(
            {
                "message": "Categories retrived successfully.",
                "data" : serializer.data,    
            },
            status =status.HTTP_200_OK
        )
        
        
        
    @extend_schema(
        summary="Create Category",
        description="Create a new category.",
        request=CategorySerializer,
        responses=CategorySerializer,
    )

    def post(self, request):

        serializer = CategorySerializer(data=request.data)

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Category created successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


@extend_schema(
    summary="Category Detail",
    description="Retrieve, update or delete a category.",
    tags=["Category"],
)
class CategoryDetailAPIView(APIView):

    def get_object(self, pk):
        try:
            return Category.objects.get(pk=pk)

        except Category.DoesNotExist:
            return None

    def get(self, request, pk):

        category = self.get_object(pk)

        if not category:
            return Response(
                {
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(category)

        return Response(
            {
                "message": "Category retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):

        category = self.get_object(pk)

        if not category:
            return Response(
                {
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(
            category,
            data=request.data,
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Category updated successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):

        category = self.get_object(pk)

        if not category:
            return Response(
                {
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = CategorySerializer(
            category,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Category updated successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):

        category = self.get_object(pk)

        if not category:
            return Response(
                {
                    "message": "Category not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        category.delete()

        return Response(
            {
                "message": "Category deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT,
        )