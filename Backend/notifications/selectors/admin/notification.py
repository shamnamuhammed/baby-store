from notifications.models import Notification


def get_all_notifications():
    return Notification.objects.all().order_by("-created_at")