from django.db import transaction
from django.db.models import F
from addresses.models import Address
from cart.models import Cart
from orders.models import (
    Order,
    OrderAddress,
    OrderItem,
)
from products.models import Product
from rest_framework.exceptions import ValidationError, NotFound
from offers.selectors.public import (
    get_active_product_offer,
    get_active_category_offer,
)

from offers.services.public import get_best_discount

def create_order(*, user, address_id):
    """
    Create an order from the authenticated user's cart.
    """
    
    # Validate Address
    try:
        address = Address.objects.get(
            pk=address_id,
            user=user,
        )
    except Address.DoesNotExist:
        raise NotFound("Address not found.")
   
    # Get Cart
    try:
        cart = Cart.objects.get(
            user=user,
        )
       
    except Cart.DoesNotExist:
        raise NotFound("Cart not found.")



    pending_order = Order.objects.filter(
        user=user,
        status=Order.OrderStatus.PENDING,
        payment__status="PENDING",
    ).exists()
    

    if pending_order:
        raise ValidationError(
            "Please complete or cancel your previous order first."
        )

    with transaction.atomic():
        
        cart_items = (cart.items
            .select_related("product")
            .select_for_update(of=("self",))
        )
    
        if not cart_items.exists():
            raise ValidationError(
                "Your cart is empty."
            )

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
            # Lock the product row
            product = Product.objects.select_for_update().get(
                    pk=item.product_id
                )
            # Validate stock

            if item.quantity > product.stock_quantity:
                raise ValidationError(
                    f"Only {product.stock_quantity} items available for {product.name}."
                )

            product_offer = get_active_product_offer(
                product=product,
            )

            category_offer = get_active_category_offer(
                category=product.category,
            )

            result = get_best_discount(
                product=product,
                product_offer=product_offer,
                category_offer=category_offer,
            )

            unit_price = product.price
            discount = result["discount"]
            final_price = result["final_price"]
            subtotal = final_price * item.quantity

            OrderItem.objects.create(
                order=order,
                product=product,
                quantity=item.quantity,
                unit_price=unit_price,
                discount=discount,
                final_price=final_price,
                subtotal=subtotal,
            )

            total_amount += subtotal

        order.total_amount = total_amount
        order.final_amount = total_amount

        order.save(
            update_fields=["total_amount","final_amount"],
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

        # for item in order.items.select_related("product"):

        #     product = item.product

        #     product.stock_quantity = F("stock_quantity") + item.quantity

        #     product.save(
        #         update_fields=["stock_quantity"],
        #     )

        order.status = Order.OrderStatus.CANCELLED

        order.save(
            update_fields=["status"],
        )

    return order