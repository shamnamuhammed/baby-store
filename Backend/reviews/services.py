from rest_framework.exceptions import ValidationError
from reviews.models import Review


def create_review(*, user, product, rating, comment):
    if Review.objects.filter(user=user, product=product).exists():
        raise ValidationError(
            {
                "message": "You have already reviewed this product."
            }
        )

    return Review.objects.create(
        user=user,
        product=product,
        rating=rating,
        comment=comment,
    )