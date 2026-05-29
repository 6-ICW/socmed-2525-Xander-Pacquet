from rest_framework import serializers
from users.serializers import UserSerializer
from .models import Post, Comment


class CommentSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    likes_count = serializers.ReadOnlyField()
    reply_count = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id", "user", "text", "likes_count",
            "is_liked", "reply_count", "replies", "created_at",
        ]
        read_only_fields = ["id", "user", "created_at"]

    def get_is_liked(self, obj):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            return obj.comment_likes.filter(user=req.user).exists()
        return False

    def get_replies(self, obj):
        if obj.parent is None:
            qs = obj.replies.select_related("user").all()[:3]
            return CommentSerializer(qs, many=True, context=self.context).data
        return []


class PostSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    image_url = serializers.SerializerMethodField()
    likes_count = serializers.ReadOnlyField()
    comments_count = serializers.ReadOnlyField()
    shares_count = serializers.ReadOnlyField()
    bookmarks_count = serializers.ReadOnlyField()
    hashtags = serializers.ReadOnlyField()
    is_liked = serializers.SerializerMethodField()
    is_bookmarked = serializers.SerializerMethodField()
    is_following = serializers.SerializerMethodField()

    class Meta:
        model = Post
        fields = [
            "id", "user", "image_url", "description",
            "music", "music_artist",
            "likes_count", "comments_count", "shares_count", "bookmarks_count",
            "hashtags", "is_liked", "is_bookmarked", "is_following", "created_at",
        ]

    def get_image_url(self, obj):
        req = self.context.get("request")
        if obj.image:
            return req.build_absolute_uri(obj.image.url) if req else obj.image.url
        return ""

    def get_is_liked(self, obj):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            return obj.likes.filter(user=req.user).exists()
        return False

    def get_is_bookmarked(self, obj):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            return obj.bookmarks.filter(user=req.user).exists()
        return False

    def get_is_following(self, obj):
        req = self.context.get("request")
        if req and req.user.is_authenticated:
            return obj.user.followers.filter(follower=req.user).exists()
        return False