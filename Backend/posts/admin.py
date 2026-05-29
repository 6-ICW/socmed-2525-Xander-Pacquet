from django.contrib import admin
from .models import Post, Like, Comment, Bookmark, Share

@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["id", "user", "likes_count", "comments_count", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["user__username", "description"]

@admin.register(Like)
class LikeAdmin(admin.ModelAdmin):
    list_display = ["user", "post", "created_at"]

@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = ["user", "post", "text", "created_at"]

@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ["user", "post", "created_at"]