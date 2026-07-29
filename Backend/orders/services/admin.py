from orders.models import Order
from rest_framework.exceptions import ValidationError

def update_order(*, order, validated_data):
    """
    Update an existing order.
    """

    for field, value in validated_data.items():
        setattr(order, field, value)

    order.save()

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