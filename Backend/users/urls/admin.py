from django.urls import path

from users.views.admin.user import (
    AdminUserListAPIView,
    AdminUserDetailAPIView,
    BlockUserAPIView,
    UnblockUserAPIView,
)

urlpatterns = [

    path(
        "",
        AdminUserListAPIView.as_view(),
        name="admin-user-list",
    ),

    path(
        "<int:pk>/",
        AdminUserDetailAPIView.as_view(),
        name="admin-user-detail",
    ),

    path(
        "<int:pk>/block/",
        BlockUserAPIView.as_view(),
        name="admin-user-block",
    ),

    path(
        "<int:pk>/unblock/",
        UnblockUserAPIView.as_view(),
        name="admin-user-unblock",
    ),

]