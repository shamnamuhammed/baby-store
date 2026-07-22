from django.contrib import admin
from payments.models import Payment
# Register your models here.


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):

    list_display = (
        "id",
        "order",
        "payment_method",
        "status",
        "amount",
        "created_at",
    )

    list_filter = (
        "payment_method",
        "status",
    )

    search_fields = (
        "transaction_id",
        "order__id",
        "order__user__email",
    )

    ordering = (
        "-created_at",
    )