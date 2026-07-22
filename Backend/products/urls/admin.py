from django.urls import path
from products.views.admin.product import (
    AdminProductListAPIView,AdminProductDetailAPIView
)
from products.views.admin.product_image import (
    AdminProductImageAPIView,
    AdminProductImageDetailAPIView,
    AdminPrimaryProductImageAPIView,
)

from products.views.admin.category import (
    AdminCategoryListAPIView,
    AdminCategoryDetailAPIView,
)

from products.views.admin.brand import (
    AdminBrandListAPIView,
    AdminBrandDetailAPIView,
)

from products.views.admin.dashboard import (
    AdminDashboardAPIView,
)


urlpatterns = [
    path(
        "",
        AdminProductListAPIView.as_view(),
        name="admin-product-list",
    ),
    path(
        "<int:pk>/",
        AdminProductDetailAPIView.as_view(),
        name="admin-product-detail",
    ),
    
    path(
        "<int:product_id>/images/",
        AdminProductImageAPIView.as_view(),
        name="admin-product-images",
    ),

    path(
        "images/<int:image_id>/",
        AdminProductImageDetailAPIView.as_view(),
        name="admin-product-image-delete",
    ),

    path(
        "images/<int:image_id>/primary/",
        AdminPrimaryProductImageAPIView.as_view(),
        name="admin-product-primary-image",
    ),
    
    path(
        "categories/",
        AdminCategoryListAPIView.as_view(),
        name="admin-category-list",
    ),

    path(
        "categories/<int:pk>/",
        AdminCategoryDetailAPIView.as_view(),
        name="admin-category-detail",
    ),
    
        path(
        "brands/",
        AdminBrandListAPIView.as_view(),
        name="admin-brand-list",
    ),

    path(
        "brands/<int:pk>/",
        AdminBrandDetailAPIView.as_view(),
        name="admin-brand-detail",
    ),
    
    path(
        "dashboard/",
        AdminDashboardAPIView.as_view(),
        name="admin-dashboard",
    ),


]