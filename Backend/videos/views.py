from rest_framework import generics
from .models import Video
from .serializers import VideoSerializer

class FeedView(generics.ListAPIView):
    queryset = Video.objects.all().order_by('-created_at')
    serializer_class = VideoSerializer