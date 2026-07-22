from products.models import ProductImage


def upload_product_image(
    product,
    image,
    alt_text,
):

    if not ProductImage.objects.filter(
        product=product,
        is_primary=True,
    ).exists():

        is_primary = True

    else:

        is_primary = False

    return ProductImage.objects.create(
        product=product,
        image=image,
        alt_text=alt_text,
        is_primary=is_primary,
    )


def delete_product_image(image):

    image.delete()


def set_primary_image(image):

    ProductImage.objects.filter(
        product=image.product,
    ).update(
        is_primary=False,
    )

    image.is_primary = True

    image.save()

    return image