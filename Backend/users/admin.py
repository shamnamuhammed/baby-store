from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.models import User


# Register your models here.

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    
    
    list_display=(
        "id",
        "username",
        "email",
        "phone_number",
        "is_verified",
        "is_staff",
        "is_active",
        "created_at",
    )
    
    
    search_fields=(
        "username",
        "email",
        "phone_number"
        
    )
    
    
    list_filter=(
        "is_verified",
        "is_staff",
        "is_active",
        "gender"
    )
    
    
    ordering=(
        "-created_at",
    )
    
    readonly_fields=(
        "created_at",
        "updated_at",
        "last_login",
    )
    
    
    fieldsets =UserAdmin.fieldsets + (
        (
            "Profile Information",
            {
                "fields":(
                    "phone_number",
                    "profile_image",
                    "date_of_birth",
                    "gender",
                    "is_verified",
                )
            },
        ),
        
        (
            "Timestamps",
            {
                "fields":(
                    "created_at",
                    "updated_at",
                    
                )
            },
        ),
    )