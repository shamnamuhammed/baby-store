from rest_framework.exceptions import ValidationError

from reviews.models import Review
from orders.models import Order


def create_review(*, user, product, rating, comment):
    delivered_purchase = Order.objects.filter(
        user=user,
        status="DELIVERED",
        items__product=product,
    ).exists()

    if not delivered_purchase:
        raise ValidationError({
            "message": "You can review a product only after it has been delivered."
        })

    if Review.objects.filter(user=user, product=product).exists():
        raise ValidationError({
            "message": "You have already reviewed this product."
        })

    return Review.objects.create(
        user=user,
        product=product,
        rating=rating,
        comment=comment,
    )