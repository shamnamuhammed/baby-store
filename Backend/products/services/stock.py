from django.db import transaction
from django.db.models import F
from rest_framework.exceptions import ValidationError

from products.models import Product


class StockService:

    @staticmethod
    @transaction.atomic
    def reduce_stock(order):
        """
        Reduce product stock exactly once for an order.

        The order row is locked so that two concurrent operations
        cannot reduce the same order's stock twice.

        Product stock is updated atomically using F expressions
        and a stock >= quantity condition to prevent overselling.
        """

        locked_order = (
            order.__class__
            .objects
            .select_for_update()
            .get(pk=order.pk)
        )

        # Stock has already been reduced.
        if locked_order.stock_reduced:
            return False

        # Stock must never be reduced again after restoration.
        if locked_order.stock_restored:
            raise ValidationError({
                "message": "Stock has already been restored for this order."
            })

        # Process products in a deterministic order.
        # This reduces the possibility of deadlocks when
        # multiple orders contain the same products.
        items = list(
            locked_order.items
            .select_related("product")
            .order_by("product_id")
        )

        for item in items:

            updated = (
                Product.objects
                .filter(
                    id=item.product_id,
                    stock_quantity__gte=item.quantity,
                )
                .update(
                    stock_quantity=F("stock_quantity") - item.quantity
                )
            )

            if updated == 0:
                raise ValidationError({
                    "message": (
                        f"Insufficient stock for "
                        f"{item.product.name}."
                    )
                })

        locked_order.stock_reduced = True

        locked_order.save(
            update_fields=[
                "stock_reduced",
                "updated_at",
            ]
        )

        return True

    @staticmethod
    @transaction.atomic
    def restore_stock(order):
        """
        Restore product stock exactly once.

        If stock was never reduced, nothing is restored.
        If stock was already restored, nothing is restored again.
        """

        locked_order = (
            order.__class__
            .objects
            .select_for_update()
            .get(pk=order.pk)
        )

        # Stock was never reduced.
        if not locked_order.stock_reduced:
            return False

        # Stock was already restored.
        if locked_order.stock_restored:
            return False

        items = list(
            locked_order.items
            .select_related("product")
            .order_by("product_id")
        )

        for item in items:

            Product.objects.filter(
                id=item.product_id
            ).update(
                stock_quantity=F("stock_quantity") + item.quantity
            )

        locked_order.stock_restored = True

        locked_order.save(
            update_fields=[
                "stock_restored",
                "updated_at",
            ]
        )

        return True

    @staticmethod
    def validate_stock(order):
        """
        Check whether all products have enough stock.

        This is an early validation only.
        The authoritative stock check happens again inside
        reduce_stock() using an atomic database update.
        """

        for item in (
            order.items
            .select_related("product")
            .order_by("product_id")
        ):

            if item.product.stock_quantity < item.quantity:
                raise ValidationError({
                    "message": (
                        f"Insufficient stock for "
                        f"{item.product.name}."
                    )
                })