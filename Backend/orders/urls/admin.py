from django.urls import path

from orders.views.admin.order import (
    AdminOrderListAPIView,
    AdminOrderDetailAPIView,
)

urlpatterns = [
    path(
        "",
        AdminOrderListAPIView.as_view(),
        name="admin-order-list",
    ),

    path(
        "<int:pk>/",
        AdminOrderDetailAPIView.as_view(),
        name="admin-order-detail",
    ),
]