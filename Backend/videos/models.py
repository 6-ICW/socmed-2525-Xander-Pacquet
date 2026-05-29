from django.db import models
from users.models import User

class Video(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE)
    caption = models.TextField()
    video = models.FileField(upload_to='videos/')
    thumbnail = models.ImageField(upload_to='thumbs/')
    created_at = models.DateTimeField(auto_now_add=True)
    views = models.IntegerField(default=0)