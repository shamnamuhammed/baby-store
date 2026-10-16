from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from core.response import success_response

from notifications.serializers import NotificationSerializer
from notifications.selectors.public import (
    get_user_notifications,
    get_unread_notifications,
    get_notification_by_id,
)
from notifications.services.public.notification import NotificationService


class NotificationListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = get_user_notifications(
            user=request.user
        )

        serializer = NotificationSerializer(
            notifications,
            many=True,
        )

        return success_response(
            message="Notifications retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class UnreadNotificationListAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        notifications = get_unread_notifications(
            user=request.user
        )

        serializer = NotificationSerializer(
            notifications,
            many=True,
        )

        return success_response(
            message="Unread notifications retrieved successfully.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class MarkNotificationAsReadAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request, notification_id):

        notification = get_notification_by_id(
            notification_id=notification_id,
            user=request.user,
        )

        if not notification:
            return success_response(
                message="Notification not found.",
                data=None,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        notification = NotificationService.mark_as_read(
            notification
        )

        serializer = NotificationSerializer(
            notification
        )

        return success_response(
            message="Notification marked as read.",
            data=serializer.data,
            status_code=status.HTTP_200_OK,
        )


class MarkAllNotificationsAsReadAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def patch(self, request):

        NotificationService.mark_all_as_read(
            user=request.user
        )

        return success_response(
            message="All notifications marked as read.",
            data=None,
            status_code=status.HTTP_200_OK,
        )


class DeleteNotificationAPIView(APIView):

    permission_classes = [IsAuthenticated]

    def delete(self, request, notification_id):

        notification = get_notification_by_id(
            notification_id=notification_id,
            user=request.user,
        )

        if not notification:
            return success_response(
                message="Notification not found.",
                data=None,
                status_code=status.HTTP_404_NOT_FOUND,
            )

        NotificationService.delete_notification(
            notification
        )

        return success_response(
            message="Notification deleted successfully.",
            data=None,
            status_code=status.HTTP_200_OK,
        )