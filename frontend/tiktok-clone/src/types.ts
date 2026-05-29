export interface User {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  likes_count: number;
  bio: string;
  posts_count: number;
}

export interface Post {
  id: number;
  user: User;
  image_url: string;
  description: string;
  music: string;
  music_artist: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  bookmarks_count: number;
  is_liked: boolean;
  is_bookmarked: boolean;
  is_following: boolean;
  hashtags: string[];
  created_at: string;
}

export interface Comment {
  id: number;
  user: User;
  text: string;
  likes_count: number;
  is_liked: boolean;
  created_at: string;
  reply_count: number;
  replies: Comment[];
}

export interface Message {
  id: number;
  sender: User;
  receiver: User;
  text: string;
  created_at: string;
  is_read: boolean;
}

export interface Conversation {
  id: number;
  other_user: User;
  last_message: string;
  last_message_time: string;
  unread_count: number;
}

export interface AuthUser {
  id: number;
  username: string;
  display_name: string;
  avatar: string | null;
  is_verified: boolean;
  followers_count: number;
  following_count: number;
  likes_count: number;
  bio: string;
  posts_count: number;
}