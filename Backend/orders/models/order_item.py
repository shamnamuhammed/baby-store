from django.db import models

from .order import Order
from products.models import Product


class OrderItem(models.Model):

    order = models.ForeignKey(
        Order,
        on_delete=models.CASCADE,
        related_name="items",
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="order_items",
    )

    quantity = models.PositiveIntegerField()

    # Original product price
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    # Discount per unit
    discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    # Price after discount (per unit)
    final_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    # Optional: useful for order history
    offer_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        verbose_name = "Order Item"
        verbose_name_plural = "Order Items"

    def __str__(self):
        return f"{self.product.name} x {self.quantity}"