from django.contrib.auth import get_user_model
from django.http import Http404
from django.db.models import Q
User = get_user_model()


def get_admin_users(request):

    queryset = User.objects.all()

    search = request.query_params.get("search")

    if search:
        queryset = queryset.filter(
            Q(username__icontains=search) |
            Q(email__icontains=search) |
            Q(first_name__icontains=search) |
            Q(last_name__icontains=search) |
            Q(phone_number__icontains=search)
            )

    is_active = request.query_params.get("is_active")

    if is_active is not None:
        queryset = queryset.filter(
            is_active=is_active.lower() == "true"
        )
        
    is_verified = request.query_params.get("is_verified")

    if is_verified is not None:
        queryset = queryset.filter(
            is_verified=is_verified.lower() == "true"
        )

    ordering = request.query_params.get("ordering")

    allowed = [
        "created_at",
        "-created_at",
        "email",
        "-email",
        "username",
        "-username",
    ]

    if ordering in allowed:
        queryset = queryset.order_by(ordering)

    return queryset


def get_admin_user_by_id(*, user_id):

    try:
        return User.objects.get(
            pk=user_id,
        )

    except User.DoesNotExist:
        raise Http404("User not found.")