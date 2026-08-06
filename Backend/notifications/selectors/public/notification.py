from notifications.models import Notification


def get_user_notifications(user):
    return Notification.objects.filter(
        user=user
    ).order_by("-created_at")


def get_unread_notifications(user):
    return Notification.objects.filter(
        user=user,
        is_read=False,
    ).order_by("-created_at")


def get_notification_by_id(notification_id, user):
    return Notification.objects.filter(
        id=notification_id,
        user=user,
    ).first()