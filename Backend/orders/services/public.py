from django.db import transaction
from django.db.models import F
from addresses.models import Address
from cart.models import Cart
from orders.models import (
    Order,
    OrderAddress,
    OrderItem,
)

from rest_framework.exceptions import ValidationError, NotFound


def create_order(*, user, address_id):
    """
    Create an order from the authenticated user's cart.
    """
    print("address_id =", address_id)
    # Validate Address
    try:
        address = Address.objects.get(
            pk=address_id,
            user=user,
        )
    except Address.DoesNotExist:
        raise NotFound("Address not found.")
    print("1. Address validated")

    # Get Cart
    try:
        cart = Cart.objects.get(
            user=user,
        )
        print("2. Cart found")
    except Cart.DoesNotExist:
        raise NotFound("Cart not found.")

    cart_items = cart.items.select_related("product")
    print("3. Cart items:", cart_items.count())

    if not cart_items.exists():
        raise ValidationError(
            "Your cart is empty."
        )

    pending_order = Order.objects.filter(
        user=user,
        status=Order.OrderStatus.PENDING,
        payment__status="PENDING",
    ).exists()
    print("4. Pending Order:", pending_order)

    if pending_order:
        raise ValidationError(
            "Please complete or cancel your previous order first."
        )
    print("5. Entering transaction")

    with transaction.atomic():

        order = Order.objects.create(
            user=user,
        )

        OrderAddress.objects.create(
            order=order,
            full_name=address.full_name,
            phone_number=address.phone_number,
            address_line=address.address_line_1,
            address_line_2=address.address_line_2,
            city=address.city,
            state=address.state,
            postal_code=address.postal_code,
            country=address.country,
        )

        total_amount = 0

        for item in cart_items:

            product = item.product

            if item.quantity > product.stock_quantity:
                raise ValidationError(
                    f"Only {product.stock_quantity} items available for {product.name}."
                )

            subtotal = product.price * item.quantity

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item.quantity,
                price=product.price,
                subtotal=subtotal,
            )

            # product.stock_quantity -= item.quantity

            # product.save(
            #     update_fields=["stock_quantity"],
            # )

            total_amount += subtotal

        order.total_amount = total_amount

        order.save(
            update_fields=["total_amount"],
        )

        # cart.items.all().delete()

    return order

def cancel_order(*, order_id, user):
    """
    Cancel a pending order and restore product stock.
    """

    try:
        order = (
            Order.objects
            .prefetch_related("items__product")
            .get(
                pk=order_id,
                user=user,
            )
        )

    except Order.DoesNotExist:
        raise NotFound("Order not found.")

    if order.status == Order.OrderStatus.CANCELLED:
        raise ValidationError(
            "Order is already cancelled."
        )

    if order.status != Order.OrderStatus.PENDING:
        raise ValidationError(
            "Only pending orders can be cancelled."
        )

    with transaction.atomic():

        for item in order.items.select_related("product"):

            product = item.product

            product.stock_quantity = F("stock_quantity") + item.quantity

            product.save(
                update_fields=["stock_quantity"],
            )

        order.status = Order.OrderStatus.CANCELLED

        order.save(
            update_fields=["status"],
        )

    return order