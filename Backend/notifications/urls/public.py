from django.urls import path

from notifications.views.public.notification import (
    NotificationListAPIView,
    UnreadNotificationListAPIView,
    MarkNotificationAsReadAPIView,
    MarkAllNotificationsAsReadAPIView,
    DeleteNotificationAPIView,
)


urlpatterns = [

    path(
        "",
        NotificationListAPIView.as_view(),
        name="notification-list",
    ),

    path(
        "unread/",
        UnreadNotificationListAPIView.as_view(),
        name="notification-unread",
    ),

    path(
        "<int:notification_id>/read/",
        MarkNotificationAsReadAPIView.as_view(),
        name="notification-read",
    ),

    path(
        "read-all/",
        MarkAllNotificationsAsReadAPIView.as_view(),
        name="notification-read-all",
    ),

    path(
        "<int:notification_id>/",
        DeleteNotificationAPIView.as_view(),
        name="notification-delete",
    ),

]