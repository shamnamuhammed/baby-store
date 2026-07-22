from products.models import Product
from django.http import Http404
from products.models import (
    Product,
    ProductImage,
)
from products.models import Category
from products.models import Brand



def get_admin_products():
    """
    Return all products for admin.
    """

    return (
        Product.objects
        .select_related(
            "category",
            "brand",
        )
        .all()
    )
    
    
def get_admin_product_by_id(*, product_id):
    """
    Return a single product for admin.
    """
    try:
        return (
            Product.objects
            .select_related(
                "category",
                "brand",
            )
            .prefetch_related(
                "images",
            )
            .get(pk=product_id)
        )

    except Product.DoesNotExist:
        raise Http404("Product not found.")
    
# -------------------------
# Product Images
# -------------------------

def get_product_images(*, product):

    return (
        ProductImage.objects
        .filter(product=product)
    )


def get_product_image_by_id(*, image_id):

    try:
        return ProductImage.objects.get(
            pk=image_id,
        )

    except ProductImage.DoesNotExist:
        raise Http404(
            "Image not found."
        )
        
        
# ==========================================
# Categories
# ==========================================

def get_admin_categories():
    return (
        Category.objects
        .prefetch_related("products")
        .all()
    )


def get_admin_category_by_id(*, category_id):

    try:
        return (
            Category.objects
            .prefetch_related("products")
            .get(pk=category_id)
        )

    except Category.DoesNotExist:
        raise Http404("Category not found.")
    

# ==========================================
# Brands
# ==========================================

def get_admin_brands():

    return (
        Brand.objects
        .prefetch_related("products")
        .all()
    )


def get_admin_brand_by_id(*, brand_id):

    try:
        return (
            Brand.objects
            .prefetch_related("products")
            .get(pk=brand_id)
        )

    except Brand.DoesNotExist:
        raise Http404("Brand not found.")