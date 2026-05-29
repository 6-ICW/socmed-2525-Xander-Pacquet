import re
from django.db import models
from users.models import User


class Post(models.Model):
    user = models.ForeignKey(User, related_name="posts", on_delete=models.CASCADE)
    image = models.ImageField(upload_to="posts/")
    description = models.TextField(blank=True, max_length=2200)
    music = models.CharField(max_length=100, blank=True, default="Origineel geluid")
    music_artist = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def likes_count(self):
        return self.likes.count()

    @property
    def comments_count(self):
        return self.comments.filter(parent=None).count()

    @property
    def shares_count(self):
        return self.shares.count()

    @property
    def bookmarks_count(self):
        return self.bookmarks.count()

    @property
    def hashtags(self):
        return re.findall(r"#(\w+)", self.description)

    def __str__(self):
        return f"{self.user.username} — post {self.id}"


class Like(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, related_name="likes", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")


class Comment(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, related_name="comments", on_delete=models.CASCADE)
    parent = models.ForeignKey(
        "self", null=True, blank=True,
        related_name="replies", on_delete=models.CASCADE
    )
    text = models.TextField(max_length=500)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    @property
    def likes_count(self):
        return self.comment_likes.count()

    @property
    def reply_count(self):
        return self.replies.count()


class CommentLike(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    comment = models.ForeignKey(
        Comment, related_name="comment_likes", on_delete=models.CASCADE
    )

    class Meta:
        unique_together = ("user", "comment")


class Bookmark(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, related_name="bookmarks", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "post")


class Share(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    post = models.ForeignKey(Post, related_name="shares", on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)