from django.contrib import admin
from orders.models import Order , OrderItem, OrderAddress


# Register your models here.
@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "status",
        "total_amount",
        "created_at",
    )

    list_filter = (
        "status",
        "created_at",
    )

    search_fields = (
        "user__email",
    )

    ordering = (
        "-created_at",
    )
    
    
@admin.register(OrderItem)
class OrderItemAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "product",
        "quantity",
        "price",
        "subtotal",
    )

    search_fields = (
        "product__name",
    )
    
@admin.register(OrderAddress)
class OrderAddressAdmin(admin.ModelAdmin):

    list_display = (
        "order",
        "full_name",
        "phone_number",
        "city",
        "country",
    )

    search_fields = (
        "full_name",
        "phone_number",
    )