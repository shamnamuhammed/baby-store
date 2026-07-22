from products.models import Brand


def create_brand(*, validated_data):

    return Brand.objects.create(
        **validated_data,
    )


def update_brand(*, brand, validated_data):

    for attr, value in validated_data.items():
        setattr(brand, attr, value)

    brand.save()

    return brand


def delete_brand(*, brand):

    brand.delete()