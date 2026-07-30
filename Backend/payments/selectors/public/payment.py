from payments.models import Payment
from orders.models import Order
from django.http import Http404
from core.utils import get_object


def get_order_for_payment(*, order_id, user):
    """
    Return a pending order belonging to the authenticated user.
    """
    try:
        return Order.objects.get(
            pk=order_id,
            user=user,
            status=Order.OrderStatus.PENDING,

        )
    except Order.DoesNotExist:
        raise Http404("Order not found.")

def get_user_payments(user):
    """
    Return all payments of the authenticated user.
    """
    return (
        Payment.objects
        .filter(order__user=user)
        .select_related("order")
        .order_by("-created_at")
    )


def get_payment_by_id(*, payment_id, user):
    """
    Return a single payment belonging to the authenticated user.
    """
    return get_object(
        Payment.objects.select_related("order"),
        message="Payment not found.",
        pk=payment_id,
        order__user=user,
    )
    
def get_payment_by_session_id(session_id):
    """
    Return payment by Stripe Checkout Session ID.
    """
    try:
        return Payment.objects.select_related(
            "order"
        ).get(
            stripe_checkout_session_id=session_id
        )
    except Payment.DoesNotExist:
        raise Http404("Payment not found.")
    
def get_payment_for_refund(
    *,
    payment_id,
    user,
):

    return get_object(
        Payment.objects.select_related(
            "order",
        ).filter(status=Payment.PaymentStatus.SUCCESS),
        message="Payment not found.",
        pk=payment_id,
        order__user=user,
    )