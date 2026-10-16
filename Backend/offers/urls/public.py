
from django.urls import path

from offers.views.public.public  import PublicOfferListAPIView


urlpatterns = [
    path(
        "",
        PublicOfferListAPIView.as_view(),
        name="public-offers",
    ),
]
