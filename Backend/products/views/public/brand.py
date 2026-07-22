from products.models import Brand
from products.serializers.public.brand import BrandSerializer

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from drf_spectacular.utils import extend_schema


@extend_schema(
    summary="List Brands",
    description="Retrieve all brands.",
    tags=["Brand"],
)
class BrandListCreateAPIView(APIView):
    
    def get(self,request):
        brands =Brand.objects.all()
        
        serializer=BrandSerializer(brands,many=True)
        
        return Response(
            {
                "message" : "Brrand Retrived successfully.",
                "data" : serializer.data
            },
            status=status.HTTP_200_OK
            
        )
        
        
    @extend_schema(
        summary="Create Brand",
        description="Create a new brand.",
        request=BrandSerializer,
        responses=BrandSerializer,
    )
    
    
    def post(self,request):
        serializer=BrandSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(
                {
                    "message" : "Brand created successfully.",
                    "data" : serializer.data,
                    }
            )
    
    

@extend_schema(
    summary="Brand Detail",
    description="Retrieve, update or delete a brand.",
    tags=["Brand"],
)           

class BrandDetailAPIView(APIView):
    
    def get_object(self,pk):
        try:
            return Brand.objects.get(pk=pk)
        except Brand.DoesNotExist:
            return None
    
    def get(self,request,pk):
        brand = self.get_object(pk)

        if not brand:
            return Response(
                {
                    "message": "Brand not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BrandSerializer(brand)

        return Response(
            {
                "message": "Brand retrieved successfully.",
                "data": serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    def put(self, request, pk):

        brand = self.get_object(pk)

        if not brand:
            return Response(
                {
                    "message": "Brand not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BrandSerializer(
            brand,
            data=request.data,
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Brand updated successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def patch(self, request, pk):

        brand = self.get_object(pk)

        if not brand:
            return Response(
                {
                    "message": "Brand not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = BrandSerializer(
            brand,
            data=request.data,
            partial=True,
        )

        if serializer.is_valid():

            serializer.save()

            return Response(
                {
                    "message": "Brand updated successfully.",
                    "data": serializer.data,
                },
                status=status.HTTP_200_OK,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):

        brand = self.get_object(pk)

        if not brand:
            return Response(
                {
                    "message": "Brand not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        brand.delete()

        return Response(
            {
                "message": "Brand deleted successfully."
            },
            status=status.HTTP_204_NO_CONTENT,
        )