from django.urls import path

from offers.views.admin.offer import (
    AdminOfferListAPIView,
    AdminOfferDetailAPIView,
    ActivateOfferAPIView,
    DeactivateOfferAPIView,
)

urlpatterns = [
    path(
        "",
        AdminOfferListAPIView.as_view(),
        name="admin-offer-list",
    ),

    path(
        "<int:pk>/",
        AdminOfferDetailAPIView.as_view(),
        name="admin-offer-detail",
    ),

    path(
        "<int:pk>/activate/",
        ActivateOfferAPIView.as_view(),
        name="admin-offer-activate",
    ),

    path(
        "<int:pk>/deactivate/",
        DeactivateOfferAPIView.as_view(),
        name="admin-offer-deactivate",
    ),
]