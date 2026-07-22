from django.db import models

from orders.models.order import Order


class OrderAddress(models.Model):

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="shipping_address",
    )

    full_name = models.CharField(
        max_length=100,
    )

    phone_number = models.CharField(
        max_length=15,
    )

    address_line = models.CharField(
        max_length=255,
    )
    address_line_2 = models.CharField(
        max_length=255,
        blank=True,
    )

    city = models.CharField(
        max_length=100,
    )

    state = models.CharField(
        max_length=100,
    )

    postal_code = models.CharField(
        max_length=20,
    )

    country = models.CharField(
        max_length=100,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "Order Address"
        verbose_name_plural = "Order Addresses"

    def __str__(self):
        return f"{self.full_name} - Order #{self.order.id}"