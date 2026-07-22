from django.contrib import admin
from .models import Category,Brand,Product,ProductImage


# Register your models here.
@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display=(
        "id",
        "name",
        "slug",
        "is_active",
        "created_at",
    )
    
    search_fields =(
        "name",
        "slug",
    )
    
    prepopulated_fields = {
        "slug": ("name",)
    }
    list_filter = (
        "is_active",
    )
    
    
    
@admin.register(Brand)
class BrandAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "name",
        "slug",
        "is_active",
    )

    prepopulated_fields = {
        "slug": ("name",)
    }

    search_fields = (
        "name",
    )
    
@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "name",
        "category",
        "brand",
        "price",
        "stock_quantity",
        "is_active",
        "is_featured",
    )

    list_filter = (
        "category",
        "brand",
        "is_active",
        "is_featured",
    )

    search_fields = (
        "name",
        "sku",
    )

    prepopulated_fields = {
        "slug": ("name",)
    }
    
    



@admin.register(ProductImage)
class ProductImageAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "product",
        "is_primary",
    )

    list_filter = (
        "is_primary",
    )

    search_fields = (
        "product__name",
    )
    
    