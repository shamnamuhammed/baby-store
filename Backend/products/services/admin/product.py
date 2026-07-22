from django.db import transaction
from rest_framework.response import Response
from rest_framework import status
from products.models import Product


@transaction.atomic
def create_product(*, validated_data):
    """
    Create a new product.
    """

    return Product.objects.create(**validated_data)

@transaction.atomic
def update_product(*, product, validated_data):

    for field, value in validated_data.items():
        setattr(product, field, value)

    product.save()

    return product


@transaction.atomic
def delete_product(*, product):

    product.is_active = False
    product.save(update_fields=["is_active"])
    
    return Response(
    {
        "message": "Product deleted successfully."
    },
    status=status.HTTP_200_OK
)