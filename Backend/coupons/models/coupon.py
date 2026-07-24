from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError

class Coupon(models.Model):
    """
    Coupon model for discounts.
    """

    class DiscountType(models.TextChoices):
        FIXED = "FIXED", "Fixed Amount"
        PERCENTAGE = "PERCENTAGE", "Percentage"

    code = models.CharField(
        max_length=50,
        unique=True,
    )

    discount_type = models.CharField(
        max_length=20,
        choices=DiscountType.choices,
    )

    discount_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[
            MinValueValidator(0),
        ],
    )

    minimum_order_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        validators=[
            MinValueValidator(0),
        ],
    )

    maximum_discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        validators=[
            MinValueValidator(0),
        ],
        help_text="Used only for percentage discounts.",
    )

    valid_from = models.DateTimeField()

    valid_to = models.DateTimeField()

    usage_limit = models.PositiveIntegerField(
        default=1,
    )

    used_count = models.PositiveIntegerField(
        default=0,
    )

    usage_per_user = models.BooleanField(
        default=True,
    )

    is_active = models.BooleanField(
        default=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Coupon"
        verbose_name_plural = "Coupons"

    def __str__(self):
        return self.code
    
    def clean(self):
        """
        Validate coupon dates.
        """
        if self.valid_to <= self.valid_from:
            raise ValidationError(
                {
                    "valid_to": "Expiry date must be after the start date."
                }
            )

    def save(self, *args, **kwargs):
        """
        Always store coupon code in uppercase.
        """
        self.code = self.code.upper()
        self.full_clean()
        super().save(*args, **kwargs)