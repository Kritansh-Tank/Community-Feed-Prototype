# Engineering Explainer

## 1. The Tree: Nested Comment Architecture

### Modeling
We used a **Recursive Foreign Key** in the `Comment` model:
```python
parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='replies')
```
This is the most flexible way to model arbitrary depth.

### Efficient Serialization (Avoiding N+1)
The "AI Slop" way is to use a recursive serializer that calls itself for every reply. With 50 comments, that's 50+ database queries. 

**My Solution:**
I implemented a high-performance tree builder in `PostViewSet.comments`:
1. **Single Query:** Fetch all comments for a post in one SQL query using `.select_related('author')`.
2. **In-Memory Mapping:** Build a dictionary of comments by ID.
3. **Linear Construction:** Iterate once through the list, attaching each comment to its parent's `precomputed_replies` list in memory.
4. **Root Filtering:** Return only the top-level comments to the serializer.

This reduces the complexity from **O(N) queries** to **exactly 1 query**, regardless of tree depth or comment count.

## 2. The Math: Dynamic 24h Leaderboard

To calculate the leaderboard dynamically without storing "stale" karma totals, I used a sophisticated `Subquery` approach to avoid the "Cartesian Product" issue (where joining Posts and Comments multipliers the counts).

```python
last_24h = timezone.now() - timedelta(hours=24)

# Subquery for Post Karma
post_karma_sub = Like.objects.filter(
    created_at__gte=last_24h,
    post__author=OuterRef('pk')
).values('post__author').annotate(total=Count('id')*5).values('total')

# Subquery for Comment Karma
comment_karma_sub = Like.objects.filter(
    created_at__gte=last_24h,
    comment__author=OuterRef('pk')
).values('comment__author').annotate(total=Count('id')).values('total')

# Main Query
top_users = User.objects.annotate(
    p_karma=Coalesce(Subquery(post_karma_sub, output_field=IntegerField()), 0),
    c_karma=Coalesce(Subquery(comment_karma_sub, output_field=IntegerField()), 0)
).annotate(
    total_karma=F('p_karma') + F('c_karma')
).filter(total_karma__gt=0).order_by('-total_karma')[:5]
```

## 3. The AI Audit

**The Bug:** When I asked the AI to help with the leaderboard, it initially suggested a simple `Sum(Case(...))` across joins:
```python
User.objects.annotate(
    karma=Sum(Case(When(posts__likes__created_at__gte=last_24h, then=5), ...))
)
```
**Why it failed:** In Django, joining a User to both `Posts` and `Comments` simultaneously creates a cross-product in SQL. If a user has 2 posts and 3 comments, the database produces 6 rows for that user, causing the `Sum` to triple or double count likes. 

**The Fix:** I discarded the join-based approach and moved to **correlated subqueries** (shown above). This ensures that post karma and comment karma are calculated in isolation before being summed, maintaining 100% data integrity.
