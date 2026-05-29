from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from users.views import MyTokenObtainPairView, RegisterView, MeView
from users.views import MyTokenObtainPairView, RegisterView, MeView, PasswordResetRequestView, PasswordResetConfirmView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/auth/token/", MyTokenObtainPairView.as_view()),
    path("api/auth/token/refresh/", TokenRefreshView.as_view()),
    path("api/auth/register/", RegisterView.as_view()),
    path("api/auth/me/", MeView.as_view()),
    path("api/auth/password-reset/", PasswordResetRequestView.as_view()),
    path("api/auth/password-reset/confirm/", PasswordResetConfirmView.as_view()),
    path("api/users/", include("users.urls")),
    path("api/posts/", include("posts.urls")),
    path("api/inbox/", include("inbox.urls")),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
