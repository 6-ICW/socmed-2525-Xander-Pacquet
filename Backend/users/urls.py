from django.urls import path
from .views import (
    UserDetailView, UserPostsView, FollowView,
    UpdateProfileView, PasswordResetRequestView, PasswordResetConfirmView,
)

urlpatterns = [
    path("<int:pk>/", UserDetailView.as_view()),
    path("<int:pk>/posts/", UserPostsView.as_view()),
    path("<int:pk>/follow/", FollowView.as_view()),
    path("me/update/", UpdateProfileView.as_view()),
    path("posts/<int:pk>/", PostUpdateView.as_view(), name="post-update"),
]
