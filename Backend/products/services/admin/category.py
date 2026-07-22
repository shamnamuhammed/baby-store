from products.models import Category


def create_category(*, validated_data):

    return Category.objects.create(
        **validated_data,
    )


def update_category(*, category, validated_data):

    for attr, value in validated_data.items():
        setattr(category, attr, value)

    category.save()

    return category


def delete_category(*, category):

    category.delete()