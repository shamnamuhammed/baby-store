from orders.models import Order
from rest_framework.exceptions import ValidationError
from notifications.tasks import (
    send_order_confirmation_email_task,
    send_order_shipped_email_task,
    send_order_delivered_email_task,
)
from products.services.stock import StockService

def update_order(*, order, validated_data):
    """
    Update an existing order.
    """

    new_status = validated_data.get("status")

    # Already same status
    if new_status == order.status:
        return order

    # CONFIRMED
    if new_status == Order.OrderStatus.CONFIRMED:

        order.status = new_status
        order.save(update_fields=["status"])

        send_order_confirmation_email_task.delay(order.id)

        return order

    # SHIPPED
    if new_status == Order.OrderStatus.SHIPPED:

        order.status = new_status
        order.save(update_fields=["status"])

        return order

    # DELIVERED
    if new_status == Order.OrderStatus.DELIVERED:

        order.status = new_status
        order.save(update_fields=["status"])

        return order

    # CANCELLED
    if new_status == Order.OrderStatus.CANCELLED:

        if hasattr(order, "payment"):

            payment = order.payment

            if payment.status == payment.PaymentStatus.SUCCESS:

                StockService.restore_stock(order)

        order.status = new_status
        order.save(update_fields=["status"])

        return order

    return order


def delete_order(*, order):
    """
    Delete an order.
    """

    if order.status != Order.OrderStatus.PENDING:
            raise ValidationError(
                {
                    "message": (
                        "Only pending orders can be deleted."
                    )
                }
            )
            
    if hasattr(order, "payment"):
        raise ValidationError(
            {
                "message": (
                    "Orders with payments cannot be deleted."
                )
            }
        )

    order.delete()