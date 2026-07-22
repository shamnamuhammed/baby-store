from rest_framework.views import APIView
from rest_framework import status
from drf_spectacular.utils import extend_schema
from core.permission import IsAdmin
from users.selectors.admin import (
    get_admin_users,
    get_admin_user_by_id,
)
from users.serializers.admin.user import (
    AdminUserSerializer,
    AdminUserUpdateSerializer,
)
from users.services.admin import (
    update_user,
    block_user,
    unblock_user,
    delete_user
)
from core.pagination import CustomPagination
from core.response import success_response


class AdminUserListAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="List Users",
        description="Retrieve all users.",
        tags=["Admin Users"],
        responses=AdminUserSerializer(many=True),
    )
    def get(self, request):

        users = get_admin_users(request)

        paginator = CustomPagination()

        page = paginator.paginate_queryset(
            users,
            request,
        )

        serializer = AdminUserSerializer(
            page,
            many=True,
        )

        return paginator.get_paginated_response(
            serializer.data,
        )


class AdminUserDetailAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Retrieve User",
        description="Retrieve a single user.",
        tags=["Admin Users"],
        responses=AdminUserSerializer,
    )
    def get(self, request, pk):

        user = get_admin_user_by_id(
            user_id=pk,
        )

        return success_response(
            message="User retrieved successfully.",
            data=AdminUserSerializer(user).data,
            status_code=status.HTTP_200_OK,
        )

    @extend_schema(
        summary="Update User",
        description="Update user profile.",
        tags=["Admin Users"],
        request=AdminUserUpdateSerializer,
        responses=AdminUserSerializer,
    )
    def patch(self, request, pk):

        user = get_admin_user_by_id(
            user_id=pk,
        )

        serializer = AdminUserUpdateSerializer(
            user,
            data=request.data,
            partial=True,
        )

        serializer.is_valid(
            raise_exception=True,
        )

        user = update_user(
            user=user,
            validated_data=serializer.validated_data,
        )

        return success_response(
            message="User updated successfully.",
            data=AdminUserSerializer(user).data,
        )
        
        
    @extend_schema(
        summary="Delete User",
        description="Delete a user account.",
        tags=["Admin Users"],
    )
    def delete(self, request, pk):

        user = get_admin_user_by_id(
            user_id=pk,
        )

        delete_user(user=user)

        return success_response(
            message="User deleted successfully.",
            status_code=status.HTTP_204_NO_CONTENT,
        )
        
        
class BlockUserAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Block User",
        description="Block a user account.",
        tags=["Admin Users"],
        responses=AdminUserSerializer,
    )
    def patch(self, request, pk):

        user = get_admin_user_by_id(
            user_id=pk,
        )

        user = block_user(
            user=user,
        )

        return success_response(
            message="User blocked successfully.",
            data=AdminUserSerializer(user).data,
        )


class UnblockUserAPIView(APIView):

    permission_classes = [IsAdmin]

    @extend_schema(
        summary="Unblock User",
        description="Unblock a user account.",
        tags=["Admin Users"],
        responses=AdminUserSerializer,
    )
    def patch(self, request, pk):

        user = get_admin_user_by_id(
            user_id=pk,
        )

        user = unblock_user(
            user=user,
        )

        return success_response(
            message="User unblocked successfully.",
            data=AdminUserSerializer(user).data,
        )