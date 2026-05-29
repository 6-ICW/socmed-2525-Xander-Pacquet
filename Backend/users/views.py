from rest_framework import generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import User, Follow
from .serializers import UserSerializer, RegisterSerializer, MyTokenObtainPairSerializer
import random
import string
from django.core.cache import cache
from django.contrib.auth.hashers import make_password


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        # Genereer een 6-cijferige code
        code = "".join(random.choices(string.digits, k=6))
        # Sla op in cache voor 15 minuten
        cache.set(f"reset_{email}", code, 60 * 15)
        # In productie: stuur een echte e-mail
        # Voor nu: print in de terminal
        print(f"\n🔑 Wachtwoord reset code voor {email}: {code}\n")
        return Response({"detail": "Code verstuurd"})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get("email", "")
        code = request.data.get("code", "")
        new_password = request.data.get("new_password", "")

        saved_code = cache.get(f"reset_{email}")
        if not saved_code or saved_code != code:
            return Response({"detail": "Code is ongeldig of verlopen."}, status=400)

        try:
            user = User.objects.get(email=email)
            user.set_password(new_password)
            user.save()
            cache.delete(f"reset_{email}")
            return Response({"detail": "Wachtwoord gewijzigd"})
        except User.DoesNotExist:
            return Response({"detail": "Gebruiker niet gevonden."}, status=404)


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user, context={"request": request}).data)

    def patch(self, request):
        s = UserSerializer(
            request.user, data=request.data,
            partial=True, context={"request": request}
        )
        s.is_valid(raise_exception=True)
        s.save()
        return Response(s.data)


class UserDetailView(generics.RetrieveAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer


class UserPostsView(APIView):
    def get(self, request, pk):
        from posts.models import Post
        from posts.serializers import PostSerializer
        posts = Post.objects.filter(user_id=pk).select_related("user")
        return Response({
            "results": PostSerializer(posts, many=True, context={"request": request}).data
        })


class FollowView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            target = User.objects.get(pk=pk)
        except User.DoesNotExist:
            return Response(status=404)
        if target == request.user:
            return Response({"detail": "Kan jezelf niet volgen."}, status=400)
        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=target
        )
        if not created:
            follow.delete()
            return Response({"following": False})
        return Response({"following": True})

class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def patch(self, request):
        user = request.user
        if "display_name" in request.data:
            user.display_name = request.data["display_name"]
        if "bio" in request.data:
            user.bio = request.data["bio"]
        if "avatar" in request.FILES:
            user.avatar = request.FILES["avatar"]
        user.save()
        return Response(UserSerializer(user, context={"request": request}).data)