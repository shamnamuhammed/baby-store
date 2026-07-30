from django.db import transaction
from rest_framework.exceptions import ValidationError

from offers.models import Offer


@transaction.atomic
def create_offer(*, data):
    """
    Create a new offer.
    """

    name = data["name"].strip()

    if Offer.objects.filter(name__iexact=name).exists():
        raise ValidationError(
            {
                "message": "Offer with this name already exists."
            }
        )

    data["name"] = name

    return Offer.objects.create(**data)


@transaction.atomic
def update_offer(*, offer, data):
    """
    Update an existing offer.
    """

    if "name" in data:

        name = data["name"].strip()

        if Offer.objects.exclude(
            pk=offer.pk,
        ).filter(
            name__iexact=name,
        ).exists():

            raise ValidationError(
                {
                    "message": "Offer with this name already exists."
                }
            )

        data["name"] = name

    for field, value in data.items():
        setattr(offer, field, value)

    offer.save()

    return offer


@transaction.atomic
def delete_offer(*, offer):
    """
    Soft delete an offer.
    """

    offer.is_active = False

    offer.save(
        update_fields=[
            "is_active",
        ]
    )

    return offer


@transaction.atomic
def activate_offer(*, offer):
    """
    Activate an offer.
    """

    offer.is_active = True

    offer.save(
        update_fields=[
            "is_active",
        ]
    )

    return offer


@transaction.atomic
def deactivate_offer(*, offer):
    """
    Deactivate an offer.
    """

    offer.is_active = False

    offer.save(
        update_fields=[
            "is_active",
        ]
    )

    return offer