from django.urls import path

from wishlist.views import (
    AddToWishlistAPIView ,
    ViewWishlistAPIView,
    RemoveFromWishlistAPIView,
    ClearWishlistAPIView,)

urlpatterns = [
    path(
        "add/",
        AddToWishlistAPIView.as_view(),
        name="add-to-wishlist",
    ),
    
     path(
        "",
        ViewWishlistAPIView.as_view(),
        name="view-wishlist",
    ),
     
     path(
            "items/<int:pk>/",
            RemoveFromWishlistAPIView.as_view(),
            name="remove-from-wishlist",
        ),
     path(
        "clear/",
        ClearWishlistAPIView.as_view(),
        name="clear-wishlist",
    ),
]