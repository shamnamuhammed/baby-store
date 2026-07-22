from django.urls import path

from addresses.views import (CreateAddressAPIView ,
                             ListAddressesAPIView,
                             AddressDetailAPIView,
                             UpdateAddressAPIView,
                             DeleteAddressAPIView)

urlpatterns = [
    
    path(
        "",
        ListAddressesAPIView.as_view(),
        name="list-addresses",
    ),
    path(
        "create/",
        CreateAddressAPIView.as_view(),
        name="create-address",
    ),
    
    path(
        "<int:pk>/",
        AddressDetailAPIView.as_view(),
        name="address-detail",
    ),
    
    path(
        "<int:pk>/update/",
        UpdateAddressAPIView.as_view(),
        name="update-address",
    ),
    
    path(
        "<int:pk>/delete/",
        DeleteAddressAPIView.as_view(),
        name="delete-address",
    ),
]