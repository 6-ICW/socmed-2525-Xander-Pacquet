from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Post, Like, Comment, CommentLike, Bookmark
from .serializers import PostSerializer, CommentSerializer


class FeedView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        return Post.objects.select_related("user").all()


class FollowingFeedView(generics.ListAPIView):
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        following_ids = self.request.user.following.values_list("following_id", flat=True)
        return Post.objects.filter(user_id__in=following_ids).select_related("user")


class PostCreateView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        post = Post.objects.create(
            user=request.user,
            image=request.FILES.get("image"),
            description=request.data.get("description", ""),
            music=request.data.get("music", "Origineel geluid"),
            music_artist=request.data.get("music_artist", ""),
        )
        return Response(
            PostSerializer(post, context={"request": request}).data,
            status=201
        )


class PostDetailView(generics.RetrieveDestroyAPIView):
    queryset = Post.objects.all()
    serializer_class = PostSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class LikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response(status=404)
        like, created = Like.objects.get_or_create(user=request.user, post=post)
        if not created:
            like.delete()
        return Response({"liked": created, "likes_count": post.likes_count})


class BookmarkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            post = Post.objects.get(pk=pk)
        except Post.DoesNotExist:
            return Response(status=404)
        bm, created = Bookmark.objects.get_or_create(user=request.user, post=post)
        if not created:
            bm.delete()
        return Response({"bookmarked": created})


class CommentListCreateView(generics.ListCreateAPIView):
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        return Comment.objects.filter(
            post_id=self.kwargs["pk"], parent=None
        ).select_related("user")

    def perform_create(self, serializer):
        post = Post.objects.get(pk=self.kwargs["pk"])
        serializer.save(user=self.request.user, post=post)


class CommentLikeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk, comment_pk):
        try:
            comment = Comment.objects.get(pk=comment_pk)
        except Comment.DoesNotExist:
            return Response(status=404)
        cl, created = CommentLike.objects.get_or_create(
            user=request.user, comment=comment
        )
        if not created:
            cl.delete()
        return Response({"liked": created})
    
class SearchView(generics.ListAPIView):
    serializer_class = PostSerializer

    def get_queryset(self):
        query = self.request.query_params.get("q", "").strip()
        if not query:
            return Post.objects.none()
        return Post.objects.filter(user__username__icontains=query).select_related("user")