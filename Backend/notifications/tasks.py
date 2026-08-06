from celery import shared_task

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

from users.models import User

from orders.models import Order
from django.template.loader import render_to_string
from django.core.mail import EmailMultiAlternatives

@shared_task
def send_welcome_email_task(user_id):
    try:
        user = User.objects.get(id=user_id)

        html_content = render_to_string(
            "emails/welcome.html",
            {
                "first_name": user.first_name,
            },
        )

        email = EmailMultiAlternatives(
            subject="Welcome to Baby Store",
            body=f"Welcome {user.first_name}",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )

        email.attach_alternative(html_content, "text/html")

        email.send()

        print(f"Welcome email sent to {user.email}")

    except User.DoesNotExist:
        print(f"User with ID {user_id} not found.")

@shared_task
def send_order_confirmation_email_task(order_id):

    try:

        order = Order.objects.select_related(
            "user",
            "payment",
        ).get(id=order_id)

        html_content = render_to_string(
            "emails/order_confirmation.html",
            {
                "customer_name": order.user.first_name,
                "order_id": order.id,
                "total": order.total_amount,
                "status": order.status,
                "payment_method": order.payment.payment_method,
            },
        )

        email = EmailMultiAlternatives(
            subject=f"Order #{order.id} Confirmed",
            body="Your order has been placed successfully.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.user.email],
        )

        email.attach_alternative(html_content, "text/html")

        email.send()

        print(f"Order confirmation email sent to {order.user.email}")

    except Order.DoesNotExist:
        print(f"Order {order_id} not found")


@shared_task
def send_payment_success_email_task(payment_id):
    """
    Send payment success email asynchronously.
    """
    print(f"Sending payment success email for payment: {payment_id}")


@shared_task
def send_refund_email_task(payment_id):
    """
    Send refund email asynchronously.
    """
    print(f"Sending refund email for payment: {payment_id}")
    
    
@shared_task
def send_order_shipped_email_task(order_id):
    try:
        order = Order.objects.select_related("user").get(id=order_id)

        html_content = render_to_string(
            "emails/order_shipped.html",
            {
                "customer_name": order.user.first_name,
                "order_id": order.id,
            },
        )

        email = EmailMultiAlternatives(
            subject="Your Order Has Been Shipped 🚚",
            body="Your order has been shipped.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.user.email],
        )

        email.attach_alternative(html_content, "text/html")
        email.send()

        print(f"Shipped email sent to {order.user.email}")

    except Order.DoesNotExist:
        print(f"Order {order_id} not found")


@shared_task
def send_order_delivered_email_task(order_id):
    try:
        order = Order.objects.select_related("user").get(id=order_id)

        html_content = render_to_string(
            "emails/order_delivered.html",
            {
                "customer_name": order.user.first_name,
                "order_id": order.id,
            },
        )

        email = EmailMultiAlternatives(
            subject="Your Order Has Been Delivered 📦",
            body="Your order has been delivered.",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[order.user.email],
        )

        email.attach_alternative(html_content, "text/html")
        email.send()

        print(f"Delivered email sent to {order.user.email}")

    except Order.DoesNotExist:
        print(f"Order {order_id} not found")
        
        
        
from products.models import Product


@shared_task
def send_low_stock_alert_task(product_id):

    try:
        product = Product.objects.get(id=product_id)

        html_content = render_to_string(
            "emails/low_stock_alert.html",
            {
                "product_name": product.name,
                "stock": product.stock_quantity,
            },
        )

        email = EmailMultiAlternatives(
            subject="⚠️ Low Stock Alert",
            body="Low stock alert",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[settings.EMAIL_HOST_USER],   # Admin email
        )

        email.attach_alternative(
            html_content,
            "text/html",
        )

        email.send()

        print("Low stock email sent")

    except Product.DoesNotExist:
        print("Product not found")
        
        
@shared_task
def send_reset_password_email_task(user_id, uid, token):

    try:
        user = User.objects.get(id=user_id)

        reset_link = (
            f"http://127.0.0.1:3000/reset-password"
            f"?uid={uid}&token={token}"
        )

        html = render_to_string(
            "emails/reset_password.html",
            {
                "user": user,
                "reset_link": reset_link,
            },
        )

        email = EmailMultiAlternatives(
            subject="Reset Your Password",
            body="Reset your password",
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[user.email],
        )

        email.attach_alternative(html, "text/html")
        email.send()

    except User.DoesNotExist:
        pass