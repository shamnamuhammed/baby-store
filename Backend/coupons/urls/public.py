from django.urls import path

from coupons.views.public import (
    ApplyCouponAPIView,
    RemoveCouponAPIView,
)

urlpatterns = [
    path(
        "apply/",
        ApplyCouponAPIView.as_view(),
        name="apply-coupon",
    ),
    path(
        "remove/<int:order_id>/",
        RemoveCouponAPIView.as_view(),
        name="remove-coupon",
    ),
]