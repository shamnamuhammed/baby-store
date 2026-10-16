from django.db import transaction
from rest_framework.exceptions import ValidationError

from orders.models import Order
from notifications.models import Notification
from notifications.services import NotificationService
from notifications.tasks import (
    send_order_confirmation_email_task,
    send_order_shipped_email_task,
    send_order_delivered_email_task,
)
from products.services.stock import StockService


def update_order(*, order, validated_data):
    """Update an order and notify its customer when appropriate."""

    new_status = validated_data.get("status")

    # No change: avoid duplicate notifications and emails.
    if not new_status or new_status == order.status:
        return order

    if new_status == Order.OrderStatus.CONFIRMED:
        order.status = new_status
        order.save(update_fields=["status"])

        transaction.on_commit(
            lambda: send_order_confirmation_email_task.delay(order.id)
        )

        return order

    if new_status == Order.OrderStatus.SHIPPED:
        order.status = new_status
        order.save(update_fields=["status"])

        def send_shipped_updates():
            NotificationService.create_notification(
                user=order.user,
                title="Your order has been shipped!",
                message=f"Your order #{order.id} is on its way.",
                notification_type=Notification.NotificationType.ORDER,
            )
            send_order_shipped_email_task.delay(order.id)

        transaction.on_commit(send_shipped_updates)

        return order

    if new_status == Order.OrderStatus.DELIVERED:
        order.status = new_status
        order.save(update_fields=["status"])

        def send_delivered_updates():
            NotificationService.create_notification(
                user=order.user,
                title="Your order has been delivered!",
                message=f"Your order #{order.id} has been delivered successfully.",
                notification_type=Notification.NotificationType.ORDER,
            )
            send_order_delivered_email_task.delay(order.id)

        transaction.on_commit(send_delivered_updates)

        return order

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
    """Delete an order only when it is pending and has no payment."""

    if order.status != Order.OrderStatus.PENDING:
        raise ValidationError({
            "message": "Only pending orders can be deleted."
        })

    if hasattr(order, "payment"):
        raise ValidationError({
            "message": "Orders with payments cannot be deleted."
        })

    order.delete()