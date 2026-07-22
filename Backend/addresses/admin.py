from django.contrib import admin
from addresses.models import Address

# Register your models here.


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "user",
        "full_name",
        "city",
        "state",
        "country",
        "is_default",
    )

    list_filter = (
        "country",
        "state",
        "is_default",
    )

    search_fields = (
        "full_name",
        "phone",
        "city",
        "postal_code",
        "user__email",
    )

    ordering = (
        "-created_at",
    )