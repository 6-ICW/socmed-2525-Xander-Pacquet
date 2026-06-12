from django.urls import path
from .views import (
    FeedView, PostCreateView, PostDetailView,
    LikeView, BookmarkView,
    CommentListCreateView, CommentLikeView, FollowingFeedView, SearchView
)

urlpatterns = [
    path("", PostCreateView.as_view()),
    path("feed/", FeedView.as_view()),
    path("following/", FollowingFeedView.as_view()),
    path("<int:pk>/", PostDetailView.as_view()),
    path("<int:pk>/like/", LikeView.as_view()),
    path("<int:pk>/bookmark/", BookmarkView.as_view()),
    path("<int:pk>/comments/", CommentListCreateView.as_view()),
    path("<int:pk>/comments/<int:comment_pk>/like/", CommentLikeView.as_view()),
    path("search/", SearchView.as_view()),
]