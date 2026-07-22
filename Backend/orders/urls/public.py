from django.urls import path

from orders.views import (
    CreateOrderAPIView ,
    OrderListAPIView ,
    OrderDetailAPIView,
     CancelOrderAPIView,)

urlpatterns = [
    path(
        "create/",
        CreateOrderAPIView.as_view(),
        name="create-order",
    ),
    
    path(
        "",
        OrderListAPIView.as_view(),
        name="order-list",
    ),
    
    path(
        "<int:pk>/",
         OrderDetailAPIView.as_view(),
         name="order-detail",
    ),
    path(
        "<int:pk>/cancel/",
         CancelOrderAPIView.as_view(),
         name="cancel-order",
         ),

]