from django.urls import path
from .views import ConversationListView, ConversationStartView, MessageListCreateView

urlpatterns = [
    path("conversations/", ConversationListView.as_view()),
    path("conversations/start/", ConversationStartView.as_view()),
    path("chats/", ConversationListView.as_view(), name="conversation-list"),
    path("chats/<int:pk>/messages/", MessageListCreateView.as_view(), name="message-messages"),
]