from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer

from notifications.models import Notification


class NotificationService:

    @staticmethod
    def create_notification(
        *,
        user,
        title,
        message,
        notification_type,
    ):
        """
        Create a persistent notification and send it
        to the user's active WebSocket connection.
        """

        notification = Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
        )

        channel_layer = get_channel_layer()

        if channel_layer:
            async_to_sync(
                channel_layer.group_send
            )(
                f"user_{user.id}",
                {
                    "type": "notification_message",
                    "notification": {
                        "id": notification.id,
                        "title": notification.title,
                        "message": notification.message,
                        "notification_type": notification.notification_type,
                        "is_read": notification.is_read,
                        "created_at": notification.created_at.isoformat(),
                    },
                },
            )

        return notification

    @staticmethod
    def mark_as_read(notification):
        notification.is_read = True

        notification.save(
            update_fields=["is_read"]
        )

        return notification

    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(
            user=user,
            is_read=False,
        ).update(
            is_read=True
        )

    @staticmethod
    def delete_notification(notification):
        notification.delete()