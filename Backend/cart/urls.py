from django.urls import path

from cart.views import( AddToCartAPIView ,
                       ViewCartAPIView,
                       UpdateCartItemAPIView,
                       RemoveCartItemAPIView,
                        ClearCartAPIView,)

urlpatterns = [
    path(
        "add/",
        AddToCartAPIView.as_view(),
        name="cart-add",
    ),
    
    path(
        "",
        ViewCartAPIView.as_view(),
        name="view-cart",
    ),
    
    path(
        "items/<int:pk>/",
        UpdateCartItemAPIView.as_view(),
        name="update-cart-item",
    ),
        
        
    path(
        "items/<int:pk>/delete/",
        RemoveCartItemAPIView.as_view(),
        name="remove-cart-item",
    ),
    path(
        "clear/",
        ClearCartAPIView.as_view(),
        name="clear-cart"),
]