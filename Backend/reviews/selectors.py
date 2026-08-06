from reviews.models import Review


def get_product_reviews(product):
    return (
        Review.objects.filter(product=product)
        .select_related("user")
        .order_by("-created_at")
    )