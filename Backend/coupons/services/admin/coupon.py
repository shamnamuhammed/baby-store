from django.db import transaction
from rest_framework.exceptions import ValidationError

from coupons.models import Coupon


@transaction.atomic
def create_coupon(*, data):

    code = data["code"].upper()

    if Coupon.objects.filter(code=code).exists():
        raise ValidationError(
            {
                "message": "Coupon code already exists."
            }
        )

    data["code"] = code

    return Coupon.objects.create(**data)


@transaction.atomic
def update_coupon(*, coupon, data):

    if "code" in data:

        code = data["code"].upper()

        if Coupon.objects.exclude(
            pk=coupon.pk
        ).filter(
            code=code
        ).exists():

            raise ValidationError(
                {
                    "message": "Coupon code already exists."
                }
            )

        data["code"] = code

    for field, value in data.items():
        setattr(coupon, field, value)

    coupon.save()

    return coupon


@transaction.atomic
def delete_coupon(*, coupon):

    coupon.is_active = False

    coupon.save(
        update_fields=[
            "is_active",
        ]
    )

    return coupon


@transaction.atomic
def activate_coupon(*, coupon):

    coupon.is_active = True

    coupon.save(
        update_fields=[
            "is_active",
        ]
    )

    return coupon

@transaction.atomic
def deactivate_coupon(*, coupon):

    coupon.is_active = False

    coupon.save(
        update_fields=[
            "is_active",
        ]
    )

    return coupon