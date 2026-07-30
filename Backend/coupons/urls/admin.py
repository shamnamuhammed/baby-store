from django.urls import path

from coupons.views.admin import (
    AdminCouponListAPIView,
    AdminCouponDetailAPIView,
    ActivateCouponAPIView,
    DeactivateCouponAPIView,
)

urlpatterns = [

    path(
        "",
        AdminCouponListAPIView.as_view(),
        name="admin-coupon-list",
    ),

    path(
        "<int:pk>/",
        AdminCouponDetailAPIView.as_view(),
        name="admin-coupon-detail",
    ),

    path(
        "<int:pk>/activate/",
        ActivateCouponAPIView.as_view(),
        name="admin-coupon-activate",
    ),

    path(
        "<int:pk>/deactivate/",
        DeactivateCouponAPIView.as_view(),
        name="admin-coupon-deactivate",
    ),
]