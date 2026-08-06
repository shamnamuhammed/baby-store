from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.response import success_response

from products.selectors.public import get_product_by_id

from reviews.serializers import ReviewSerializer,CreateReviewSerializer
from reviews.selectors import get_product_reviews
from reviews.services import create_review


class ProductReviewAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, product_id):

        product = get_product_by_id(product_id=product_id)

        reviews = get_product_reviews(product)

        serializer = ReviewSerializer(
            reviews,
            many=True,
        )

        return success_response(
            message="Reviews retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )

    def post(self, request, product_id):

        product = get_product_by_id(product_id=product_id)
        serializer = CreateReviewSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        review = create_review(
            user=request.user,
            product=product,
            **serializer.validated_data,
        )

        return success_response(
            message="Review added successfully.",
            data=ReviewSerializer(review).data,
            status_code=status.HTTP_201_CREATED,
        )