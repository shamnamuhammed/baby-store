from django.urls import path

from reviews.views import ProductReviewAPIView

urlpatterns = [
    path(
        "products/<int:product_id>/reviews/",
        ProductReviewAPIView.as_view(),
        name="product-reviews",
    ),
]