from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from products.models import Product


class StockService:

    @staticmethod
    @transaction.atomic
    def reduce_stock(order):
        """
        Reduce stock after a successful payment.
        """

        for item in order.items.select_related("product"):

            updated = Product.objects.filter(
                id=item.product.id,
                stock_quantity__gte=item.quantity,
            ).update(
                stock_quantity=F("stock_quantity") - item.quantity
            )

            if updated == 0:
                raise ValidationError(
                    {
                        "message": (
                            f"'{item.product.name}' does not have enough stock."
                        )
                    }
                )

    @staticmethod
    @transaction.atomic
    def restore_stock(order):
        """
        Restore stock after refund/cancellation.
        """

        for item in order.items.select_related("product"):

            Product.objects.filter(
                id=item.product.id
                
            ).update(
                stock_quantity=F("stock_quantity") + item.quantity
            )
            
    @staticmethod
    def validate_stock(order):
        """
        Ensure every order item has enough stock before payment.
        """

        for item in order.items.select_related("product"):

            if item.product.stock_quantity < item.quantity:

                raise ValidationError(
                    {
                        "message": (
                            f"'{item.product.name}' has only "
                            f"{item.product.stock_quantity} item(s) available."
                        )
                    }
                )