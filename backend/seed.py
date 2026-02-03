import os
import django
import random
from datetime import timedelta
from django.utils import timezone

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth.models import User
from community.models import Post, Comment, Like

def seed():
    # Create Users
    users = []
    for i in range(1, 6):
        user, _ = User.objects.get_or_create(username=f'user{i}')
        user.set_password('password123')
        user.save()
        users.append(user)

    # Create Posts
    posts = []
    for i in range(1, 11):
        post = Post.objects.create(
            author=random.choice(users),
            text=f"This is post number {i}. It's a great day for community building!"
        )
        posts.append(post)

    # Create Comments
    for post in posts:
        for i in range(1, 4):
            comment = Comment.objects.create(
                post=post,
                author=random.choice(users),
                text=f"Comment {i} on post {post.id}"
            )
            # Add some replies
            for j in range(1, 3):
                Comment.objects.create(
                    post=post,
                    parent=comment,
                    author=random.choice(users),
                    text=f"Reply {j} to comment {comment.id}"
                )

    # Create Likes (Karma)
    # Give user1 a lot of points in the last 24h
    u1 = users[0]
    for post in posts[:5]:
        # People like u1's posts
        post.author = u1
        post.save()
        for u in users[1:]:
            Like.objects.get_or_create(user=u, post=post)
            
    # Give user2 some points from comments
    u2 = users[1]
    comments = Comment.objects.filter(author=u2)
    for c in comments:
        for u in users:
            if u != u2:
                Like.objects.get_or_create(user=u, comment=c)

    print("Seeding complete!")

if __name__ == '__main__':
    seed()
