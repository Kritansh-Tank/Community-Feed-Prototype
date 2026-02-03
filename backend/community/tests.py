from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from datetime import timedelta
from .models import Post, Comment, Like
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status

class LeaderboardTests(APITestCase):
    def setUp(self):
        self.u1 = User.objects.create_user(username='u1', password='p1')
        self.u2 = User.objects.create_user(username='u2', password='p2')
        self.post = Post.objects.create(author=self.u1, text='Post 1')
        self.comment = Comment.objects.create(post=self.post, author=self.u2, text='Comment 1')

    def test_leaderboard_calculation(self):
        """Test that karma is calculated correctly for the last 24h."""
        # u2 likes u1's post (u1 gets 5 karma)
        Like.objects.create(user=self.u2, post=self.post)
        
        # u1 likes u2's comment (u2 gets 1 karma)
        Like.objects.create(user=self.u1, comment=self.comment)
        
        # Create an old like from u1 to a new post (should not be counted)
        new_post = Post.objects.create(author=self.u2, text='Post 2')
        old_like = Like.objects.create(user=self.u1, post=new_post)
        # Manually update created_at for old_like
        Like.objects.filter(id=old_like.id).update(created_at=timezone.now() - timedelta(hours=48))

        url = reverse('leaderboard-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data
        
        # u1 should have 5 karma, u2 should have 1 karma
        u1_entry = next(u for u in data if u['username'] == 'u1')
        u2_entry = next(u for u in data if u['username'] == 'u2')
        
        self.assertEqual(u1_entry['karma'], 5)
        self.assertEqual(u2_entry['karma'], 1)

    def test_unique_likes(self):
        """Test that users cannot double like."""
        Like.objects.create(user=self.u2, post=self.post)
        with self.assertRaises(Exception):
            Like.objects.create(user=self.u2, post=self.post)
