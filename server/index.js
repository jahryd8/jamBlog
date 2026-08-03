const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // Replace with my Vite frontend URL/port
  credentials: true
}));
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.json({ status: 'API is running successfully!' });
});

// --- ESSAYS & POSTS ENDPOINTS ---

// 1. GET /api/posts/my-posts - MUST BE ABOVE /api/posts/:id
app.get('/api/posts/my-posts', async (req, res) => {
  const userId = 1; // Active user ID

  try {
    const query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.excerpt, 
        p.is_private, 
        p.created_at,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count
      FROM posts p
      WHERE p.user_id = $1
      ORDER BY p.created_at DESC;
    `;
    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user posts:', err);
    res.status(500).json({ message: 'Server error fetching user posts' });
  }
});

// 2. GET /api/posts - Fetch all public posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT posts.*, users.username, users.display_name 
       FROM posts 
       JOIN users ON posts.user_id = users.user_id 
       WHERE is_private = false 
       ORDER BY created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching posts' });
  }
});

// 3. GET /api/posts/:id - Single Post Details
app.get('/api/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const currentUserId = 1;

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid Post ID' });
  }

  try {
    const query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.content, 
        p.excerpt, 
        p.created_at, 
        p.is_private,
        p.user_id AS author_id, 
        COALESCE(u.username, 'Anonymous') AS username, 
        COALESCE(u.display_name, 'Author') AS display_name, 
        u.bio, 
        u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = $1) AS is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.post_id AND user_id = $1) AS is_bookmarked,
        EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = p.user_id) AS is_following_author
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $2;
    `;
    const result = await pool.query(query, [currentUserId, postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found in database' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post by ID:', err);
    res.status(500).json({ message: 'Server error while fetching post details' });
  }
});

// 4. POST /api/posts - Create new essay
app.post('/api/posts', async (req, res) => {
  try {
    const { user_id, title, content, excerpt, is_private } = req.body;
    const activeUserId = user_id ? user_id : 1;

    const newPost = await pool.query(
      `INSERT INTO posts (user_id, title, content, excerpt, is_private) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [activeUserId, title, content, excerpt || content?.slice(0, 150), is_private || false]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 5. PATCH /api/posts/:id/visibility - Toggle Public/Private
app.patch('/api/posts/:id/visibility', async (req, res) => {
  const postId = req.params.id;
  const { is_private } = req.body;
  const userId = 1;

  try {
    const result = await pool.query(
      `UPDATE posts SET is_private = $1 WHERE post_id = $2 AND user_id = $3 RETURNING *`,
      [is_private, postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error toggling visibility:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 6. DELETE /api/posts/:id - Delete Essay
app.delete('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const userId = 1;

  try {
    await pool.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM saved_posts WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM comments WHERE post_id = $1', [postId]);

    const result = await pool.query(
      'DELETE FROM posts WHERE post_id = $1 AND user_id = $2 RETURNING *',
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted successfully', deletedPostId: postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error while deleting essay' });
  }
});

// PUT /api/posts/:id - Edit / Update Essay
app.put('/api/posts/:id', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { title, content, excerpt, is_private } = req.body;
  const userId = 1; // Active user ID

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid Post ID' });
  }

  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ message: 'Title and content cannot be empty' });
  }

  try {
    // Generate new excerpt if not provided
    const updatedExcerpt = excerpt || content.slice(0, 150);

    const result = await pool.query(`
      UPDATE posts 
      SET 
        title = $1, 
        content = $2, 
        excerpt = $3, 
        is_private = COALESCE($4, is_private),
        updated_at = CURRENT_TIMESTAMP
      WHERE post_id = $5 AND user_id = $6
      RETURNING *
    `, [title.trim(), content.trim(), updatedExcerpt, is_private, postId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating post:', err.message);
    res.status(500).json({ message: 'Failed to update post', error: err.message });
  }
});

// --- FEED SYSTEM ---
app.get('/api/feed', async (req, res) => {
  const currentUserId = 1;
  const filter = req.query.filter || 'all';

  try {
    let query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.excerpt, 
        p.created_at,
        u.username, 
        u.display_name,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = $1) AS is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.post_id AND user_id = $1) AS is_saved
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_private = false
    `;

    if (filter === 'following') {
      query += ` AND p.user_id IN (SELECT following_id FROM user_follows WHERE follower_id = $1)`;
    }

    query += ` ORDER BY p.created_at DESC;`;

    const result = await pool.query(query, [currentUserId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching feed:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- LIKES & SAVES ENDPOINTS ---
app.post('/api/posts/:id/like', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = 1;

  try {
    const check = await pool.query(
      `SELECT 1 FROM post_likes WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );

    if (check.rows.length > 0) {
      await pool.query(`DELETE FROM post_likes WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
      res.json({ liked: false });
    } else {
      await pool.query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      res.json({ liked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/posts/:id/save', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = 1;

  try {
    const check = await pool.query(
      `SELECT 1 FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );

    if (check.rows.length > 0) {
      await pool.query(`DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
      res.json({ bookmarked: false });
    } else {
      await pool.query(`INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      res.json({ bookmarked: true });
    }
  } catch (err) {
    console.error('Error toggling save:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/bookmark - Toggle Bookmark
app.post('/api/posts/:id/bookmark', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const currentUserId = 1;

  try {
    const checkRes = await pool.query(
      `SELECT 1 FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
      [currentUserId, postId]
    );

    if (checkRes.rows.length > 0) {
      await pool.query(
        `DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
        [currentUserId, postId]
      );
      res.json({ is_bookmarked: false });
    } else {
      await pool.query(
        `INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)`,
        [currentUserId, postId]
      );
      res.json({ is_bookmarked: true });
    }
  } catch (err) {
    console.error('Error toggling bookmark:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- COMMENTS ENDPOINTS ---

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  try {
    const result = await pool.query(`
      SELECT 
        c.comment_id, c.post_id, c.user_id, c.content, 
        c.parent_comment_id, c.created_at,
        u.username, u.display_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at ASC
    `, [postId]);

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err.message);
    res.status(500).json({ message: 'Failed to fetch comments', error: err.message });
  }
});

// POST /api/posts/:id/comments - Add or Reply to Comment
app.post('/api/posts/:id/comments', async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { content, parent_comment_id, parent_id } = req.body;
  const currentUserId = 1; 

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid Post ID parameter' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  // Parse incoming parent reference safely
  const rawParent = parent_comment_id !== undefined ? parent_comment_id : parent_id;
  const parentId = (rawParent && !isNaN(parseInt(rawParent, 10))) 
    ? parseInt(rawParent, 10) 
    : null;

  try {
    // Check if post exists
    const postCheck = await pool.query('SELECT post_id FROM posts WHERE post_id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Target post does not exist' });
    }

    // Insert new comment
    const commentRes = await pool.query(`
      INSERT INTO comments (post_id, user_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [postId, currentUserId, content.trim(), parentId]);

    const newComment = commentRes.rows[0];

    // Optional notification insertion
    if (parentId) {
      try {
        const parentRes = await pool.query(
          `SELECT user_id FROM comments WHERE comment_id = $1`, 
          [parentId]
        );

        if (parentRes.rows.length > 0 && parentRes.rows[0].user_id) {
          const parentAuthorId = parentRes.rows[0].user_id;

          if (parentAuthorId !== currentUserId) {
            await pool.query(`
              INSERT INTO notifications (user_id, actor_id, post_id, type)
              VALUES ($1, $2, $3, 'comment_reply')
            `, [parentAuthorId, currentUserId, postId]);
          }
        }
      } catch (notifErr) {
        console.error('Non-critical notification insertion error:', notifErr.message);
      }
    }

    // Join with user table for avatar/username rendering
    const fullComment = await pool.query(`
      SELECT 
        c.comment_id, c.post_id, c.user_id, c.content, 
        c.parent_comment_id, c.created_at,
        u.username, u.display_name, u.avatar_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.user_id
      WHERE c.comment_id = $1
    `, [newComment.comment_id]);

    return res.status(201).json(fullComment.rows[0] || newComment);

  } catch (err) {
    console.error('--- DETAILED COMMENT ERROR ---', err);
    return res.status(500).json({ 
      message: 'Failed to submit comment', 
      error: err.message
    });
  }
});

// PATCH /api/comments/:commentId - Edit Comment
app.patch('/api/comments/:commentId', async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const { content } = req.body;

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    const result = await pool.query(`
      UPDATE comments 
      SET content = $1
      WHERE comment_id = $2
      RETURNING *
    `, [content, commentId]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

// DELETE /api/comments/:comment_id - Delete Comment
app.delete('/api/comments/:comment_id', async (req, res) => {
  const commentId = parseInt(req.params.comment_id, 10);

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    await pool.query('DELETE FROM comments WHERE comment_id = $1', [commentId]);
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

// --- USER & FOLLOW SYSTEM ---

app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = 1;

  try {
    const userQuery = `
      SELECT 
        u.user_id, u.username, u.display_name, u.bio, u.location, u.avatar_url,
        (SELECT COUNT(*) FROM user_follows WHERE following_id = u.user_id) AS followers_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = u.user_id) AS following_count,
        EXISTS(
          SELECT 1 FROM user_follows 
          WHERE follower_id = $1 AND following_id = u.user_id
        ) AS is_following
      FROM users u
      WHERE u.username = $2;
    `;
    const userResult = await pool.query(userQuery, [currentUserId, username]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = userResult.rows[0];

    const postsQuery = `
      SELECT post_id, title, excerpt, created_at 
      FROM posts 
      WHERE user_id = $1 AND is_private = false 
      ORDER BY created_at DESC;
    `;
    const postsResult = await pool.query(postsQuery, [profile.user_id]);

    res.json({
      profile,
      posts: postsResult.rows
    });
  } catch (err) {
    console.error('Error fetching author profile:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/users/:id/follow', async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  const followerId = 1;

  if (followerId === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    const checkQuery = `SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = $2;`;
    const checkResult = await pool.query(checkQuery, [followerId, targetUserId]);

    if (checkResult.rows.length > 0) {
      await pool.query(
        `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2;`,
        [followerId, targetUserId]
      );
      res.json({ isFollowing: false });
    } else {
      await pool.query(
        `INSERT INTO user_follows (follower_id, following_id) VALUES ($1, $2);`,
        [followerId, targetUserId]
      );
      res.json({ isFollowing: true });
    }
  } catch (err) {
    console.error('Error toggling follow status:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/users/:id/following', async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await pool.query(
      `SELECT u.user_id, u.username, u.display_name, u.bio 
       FROM user_follows uf
       JOIN users u ON uf.following_id = u.user_id
       WHERE uf.follower_id = $1
       ORDER BY uf.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching following list:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- SEARCH ---
app.get('/api/search', async (req, res) => {
  const query = req.query.q;

  if (!query || query.trim() === '') {
    return res.json({ posts: [], authors: [] });
  }

  const searchPattern = `%${query.trim()}%`;

  try {
    const postsQuery = `
      SELECT p.post_id, p.title, p.excerpt, p.created_at, u.username, u.display_name
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_private = false 
        AND (p.title ILIKE $1 OR p.excerpt ILIKE $1)
      ORDER BY p.created_at DESC
      LIMIT 5;
    `;
    const postsResult = await pool.query(postsQuery, [searchPattern]);

    const authorsQuery = `
      SELECT user_id, username, display_name, bio
      FROM users
      WHERE username ILIKE $1 OR display_name ILIKE $1
      LIMIT 5;
    `;
    const authorsResult = await pool.query(authorsQuery, [searchPattern]);

    res.json({
      posts: postsResult.rows,
      authors: authorsResult.rows,
    });
  } catch (err) {
    console.error('Error executing search:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- DASHBOARD STATS ---
app.get('/api/dashboard/stats', async (req, res) => {
  const currentUserId = 1;

  try {
    // Likes received on user's own posts
    const receivedRes = await pool.query(
      `SELECT COUNT(*) FROM post_likes pl 
       JOIN posts p ON pl.post_id = p.post_id 
       WHERE p.user_id = $1`,
      [currentUserId]
    );

    // Likes given by this user
    const givenRes = await pool.query(
      `SELECT COUNT(*) FROM post_likes WHERE user_id = $1`,
      [currentUserId]
    );

    // Saved bookmarks
    const savedRes = await pool.query(
      `SELECT p.post_id, p.title, p.excerpt, sp.created_at, u.username, u.display_name
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.post_id
       JOIN users u ON p.user_id = u.user_id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC`,
      [currentUserId]
    );

    res.json({
      totalLikesReceived: parseInt(receivedRes.rows[0].count, 10) || 0,
      totalLikesGiven: parseInt(givenRes.rows[0].count, 10) || 0,
      savedPosts: savedRes.rows
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching stats' });
  }
});

// START SERVER
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
}); 