from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Follow

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ["username", "email", "display_name", "is_verified", "followers_count"]
    fieldsets = BaseUserAdmin.fieldsets + (
        ("Profiel", {"fields": ("display_name", "avatar", "bio", "is_verified")}),
    )

@admin.register(Follow)
class FollowAdmin(admin.ModelAdmin):
    list_display = ["follower", "following", "created_at"]