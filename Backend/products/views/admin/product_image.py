from rest_framework import status
from rest_framework.views import APIView

from drf_spectacular.utils import extend_schema

from core.response import success_response

from core.permission import IsAdmin

from products.serializers.admin.product_image import (
    AdminProductImageSerializer,
)

from products.selectors.admin import (
    get_product_image_by_id,
    get_product_images,
)
from products.selectors.products import get_products

from products.services.admin.product_image import (
    upload_product_image,
    delete_product_image,
    set_primary_image,
)


class AdminProductImageAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(tags=["Admin Product Images"])

    def get(self, request, product_id):

        product = get_products(product_id)

        images = get_product_images(product)

        serializer = AdminProductImageSerializer(
            images,
            many=True,
            context={"request": request},
        )

        return success_response(
            message="Images retrieved successfully.",
            data=serializer.data,
        )

    @extend_schema(
        tags=["Admin Product Images"])

    def post(self, request, product_id):

        product = get_product_image_by_id(product_id)

        image = upload_product_image(
            product=product,
            image=request.FILES["image"],
            alt_text=request.data.get(
                "alt_text",
                "",
            ),
        )

        serializer = AdminProductImageSerializer(
            image,
            context={"request": request},
        )

        return success_response(
            message="Image uploaded successfully.",
            data=serializer.data,
            status_code=status.HTTP_201_CREATED,
        )


class AdminProductImageDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(tags=["Admin Product Images"])

    def delete(self, request, image_id):

        image =get_product_image_by_id(image_id)

        delete_product_image(image)

        return success_response(
            message="Image deleted successfully.",
        )


class AdminPrimaryProductImageAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        tags=["Admin Product Images"])

    def patch(self, request, image_id):

        image = get_product_image_by_id(image_id)

        image = set_primary_image(image)

        serializer = AdminProductImageSerializer(
            image,
            context={"request": request},
        )

        return success_response(
            message="Primary image updated.",
            data=serializer.data,
        )