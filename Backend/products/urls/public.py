from django.urls import path

from products.views.public.brand import (
        BrandListCreateAPIView,
    BrandDetailAPIView,)
from  products.views.public.product import (
     ProductListCreateAPIView,
        ProductDetailAPIView)
from  products.views.public.category import (
    CategoryListCreateAPIView,
    CategoryDetailAPIView,)

   


urlpatterns = [
    path(
        "categories/",
        CategoryListCreateAPIView.as_view(),
        name="category-list-create",
    ),
    path(
        "categories/<int:pk>/",
        CategoryDetailAPIView.as_view(),
        name="category-detail",
    ),
    
     # Brand
    path(
        "brands/",
        BrandListCreateAPIView.as_view(),
        name="brand-list-create",
    ),
    path(
        "brands/<int:pk>/",
        BrandDetailAPIView.as_view(),
        name="brand-detail",
    ),
    
    path(
        "", ProductListCreateAPIView.as_view(), 
         name="product-list"),
   
    path(
        "<int:pk>/", ProductDetailAPIView.as_view(), 
         name="product-detail"),
   
]