from django.utils import timezone

from rest_framework.exceptions import ValidationError
from payments.services.public import RefundService
from payments.models import Payment


def approve_refund(*, payment):

    if payment.status != Payment.PaymentStatus.REFUND_REQUESTED:

        raise ValidationError(
            {
                "message":
                "Refund request not found."
            }
        )
    return RefundService.complete_refund(
        payment=payment,
    )
   



def reject_refund(*, payment,reason=""):


    if payment.status != Payment.PaymentStatus.REFUND_REQUESTED:

        raise ValidationError(
            {
                "message":
                "Refund request not found."
            }
        )

    payment.status = Payment.PaymentStatus.SUCCESS
    payment.rejection_reason = reason

    payment.save(
        update_fields=[
            "status",
            "rejection_reason",
        ]
    )

    return payment
