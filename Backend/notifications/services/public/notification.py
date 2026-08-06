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
        Create a notification.
        """

        return Notification.objects.create(
            user=user,
            title=title,
            message=message,
            notification_type=notification_type,
        )
        
    @staticmethod
    def mark_as_read(notification):
        """
        Mark a notification as read.
        """

        notification.is_read = True
        notification.save(update_fields=["is_read"])
        return notification
    
    @staticmethod
    def mark_all_as_read(user):
        """
        Mark all notifications as read.
        """

        Notification.objects.filter(
            user=user,
            is_read=False,
        ).update(is_read=True)
        
        
    @staticmethod
    def delete_notification(notification):
        """
        Delete notification.
        """

        notification.delete()