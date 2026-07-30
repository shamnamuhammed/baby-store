from django.db import models
from django.conf import settings
from coupons.models.coupon import Coupon

from users.models import User


class CouponUsage(models.Model):
    """
    Tracks coupon usage by users.
    """

    coupon = models.ForeignKey(
        Coupon,
        on_delete=models.CASCADE,
        related_name="usages",
    )

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="coupon_usages",
    )

    order = models.OneToOneField(
       "orders.Order",
        on_delete=models.CASCADE,
        related_name="coupon_usage",
    )

    discount_amount = models.DecimalField(
        max_digits=10,
        decimal_places=2,
    )

    used_at = models.DateTimeField(
        auto_now_add=True,
    )

    class Meta:
        ordering = ["-used_at"]
        verbose_name = "Coupon Usage"
        verbose_name_plural = "Coupon Usages"

        # constraints = [
        #     models.UniqueConstraint(
        #         fields=["coupon", "user"],
        #         name="unique_coupon_per_user",
        #     )
        # ]

    def __str__(self):
        return f"{self.user.username} - {self.coupon.code}"