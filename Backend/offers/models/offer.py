from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from products.models import Product
from products.models.category import Category


class Offer(models.Model):

    class OfferType(models.TextChoices):
        PRODUCT = "PRODUCT", "Product"
        CATEGORY = "CATEGORY", "Category"

    class DiscountType(models.TextChoices):
        FIXED = "FIXED", "Fixed Amount"
        PERCENTAGE = "PERCENTAGE", "Percentage"

    name = models.CharField(
        max_length=150,
    )

    offer_type = models.CharField(
        max_length=20,
        choices=OfferType.choices,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="offers",
        null=True,
        blank=True,
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name="offers",
        null=True,
        blank=True,
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

    maximum_discount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
    )

    start_date = models.DateTimeField()

    end_date = models.DateTimeField()

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
        verbose_name = "Offer"
        verbose_name_plural = "Offers"


        
    
    def clean(self):

        if self.start_date >= self.end_date:
            raise ValidationError({
                "end_date": "End date must be after start date."
            })

        if (
            self.offer_type == self.OfferType.PRODUCT
            and self.product is None
        ):
            raise ValidationError({
                "product": "Product is required for a product offer."
            })

        if (
            self.offer_type == self.OfferType.CATEGORY
            and self.category is None
        ):
            raise ValidationError({
                "category": "Category is required for a category offer."
            })

        if (
            self.offer_type == self.OfferType.PRODUCT
            and self.category is not None
        ):
            raise ValidationError({
                "category": "Category must be empty for a product offer."
            })

        if (
            self.offer_type == self.OfferType.CATEGORY
            and self.product is not None
        ):
            raise ValidationError({
                "product": "Product must be empty for a category offer."
            })

        if (
            self.discount_type == self.DiscountType.PERCENTAGE
            and self.discount_value > 100
        ):
            raise ValidationError({
                "discount_value": "Percentage discount cannot exceed 100."
            })

        if (
            self.discount_type == self.DiscountType.FIXED
            and self.maximum_discount is not None
        ):
            raise ValidationError({
                "maximum_discount": "Maximum discount is only applicable for percentage offers."
            })
    
    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)  
        
            
    def __str__(self):
        return self.name