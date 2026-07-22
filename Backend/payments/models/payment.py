from django.db import models

from orders.models import Order


class Payment(models.Model):

    class PaymentMethod(models.TextChoices):
        COD = "COD", "Cash On Delivery"
        RAZORPAY = "RAZORPAY", "Razorpay"
        STRIPE = "STRIPE", "Stripe"

    class PaymentStatus(models.TextChoices):
        PENDING = "PENDING", "Pending"
        SUCCESS = "SUCCESS", "Success"
        FAILED = "FAILED", "Failed"
        REFUND_REQUESTED = (
            "REFUND_REQUESTED",
            "Refund Requested",
        )
        REFUNDED = "REFUNDED", "Refunded"

    order = models.OneToOneField(
        Order,
        on_delete=models.CASCADE,
        related_name="payment",
    )

    amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    payment_method = models.CharField(
        max_length=20,
        choices=PaymentMethod.choices,
    )

    status = models.CharField(
        max_length=20,
        choices=PaymentStatus.choices,
        default=PaymentStatus.PENDING,
    )

    transaction_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )
    
    stripe_checkout_session_id = models.CharField(
    max_length=255,
    blank=True,
    null=True,
    )

    stripe_payment_intent_id = models.CharField(
        max_length=255,
        blank=True,
        null=True,
    )
    
    
    gateway_response = models.JSONField(
        blank=True,
        null=True,
    )

    failure_reason = models.TextField(
        blank=True,
    )
    refund_reason = models.TextField(
        blank=True,
    )

    refunded_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
    )

    paid_at = models.DateTimeField(
        blank=True,
        null=True,
    )

    refunded_at = models.DateTimeField(
        blank=True,
        null=True,
    )   

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Payment"
        verbose_name_plural = "Payments"

    def __str__(self):
        return f"Payment #{self.pk} - {self.status}"