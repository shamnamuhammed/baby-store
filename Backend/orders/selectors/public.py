from orders.models import Order
from django.http import Http404


def get_user_orders(user):
    """
    Return all orders of a user.
    """
    return (
        Order.objects
        .filter(user=user)
        .select_related("shipping_address")
        .prefetch_related("items__product")
    )


def get_user_order_by_id(*,order_id, user):
    """
    Return a single order belonging to a user.
    """
    try:
        return (
            Order.objects
            .select_related("shipping_address")
            .prefetch_related("items__product")
            .get(
                pk=order_id,
                user=user,
                # status=Order.OrderStatus.PENDING,
            )
        )
    except Order.DoesNotExist:
        raise Http404("Order not found.")
    
def get_pending_order_by_id(*, order_id, user):
    try:
        return (
            Order.objects
            .select_related("shipping_address")
            .prefetch_related("items__product")
            .get(
                pk=order_id,
                user=user,
                status=Order.OrderStatus.PENDING,
            )
        )
    except Order.DoesNotExist:
        raise Http404("Pending order not found.")