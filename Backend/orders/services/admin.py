from orders.models import Order


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

    order.delete()