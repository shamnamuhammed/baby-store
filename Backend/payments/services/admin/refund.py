from django.db import transaction
from rest_framework.exceptions import ValidationError

from notifications.models import Notification
from notifications.services.public.notification import NotificationService
from payments.models import Payment
from payments.services.public import RefundService

def approve_refund(*, payment):
    """
    Approve a refund request.

    RefundService.complete_refund() performs the actual
    concurrency-safe refund processing.
    """

    return RefundService.complete_refund(
        payment=payment
    )


@transaction.atomic
def reject_refund(*, payment, reason=""):
    """
    Reject a refund request.

    REFUND_REQUESTED -> SUCCESS

    Order remains CONFIRMED.
    Stock remains reduced.
    """

    locked_payment = (
    Payment.objects
    .select_for_update()
    .select_related("order")
    .get(pk=payment.pk)
)

    if (
        locked_payment.status
        != Payment.PaymentStatus.REFUND_REQUESTED
    ):
        raise ValidationError({
            "message": "Refund request not found."
        })

    if not reason or not reason.strip():
        raise ValidationError({
            "message": "Rejection reason is required."
        })

    locked_payment.status = Payment.PaymentStatus.SUCCESS
    locked_payment.rejection_reason = reason.strip()

    locked_payment.save(
        update_fields=[
            "status",
            "rejection_reason",
            "updated_at",
        ]
    )

    transaction.on_commit(
        lambda: NotificationService.create_notification(
            user=locked_payment.order.user,
            title="Refund Rejected",
            message=(
                f"Your refund request for order "
                f"#{locked_payment.order.id} was rejected. "
                f"Reason: {locked_payment.rejection_reason}"
            ),
            notification_type=Notification.NotificationType.REFUND,
        )
    )

    return locked_payment