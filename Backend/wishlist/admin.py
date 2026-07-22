from django.contrib import admin
from wishlist.models import Wishlist


# Register your models here.
@admin.register(Wishlist)
class WishlistAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "product",
        "created_at",
    )

    search_fields = (
        "user__email",
        "product__name",
    )

    list_filter = (
        "created_at",
    )