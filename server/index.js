const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// --- REST API ENDPOINTS ---

// API Health Check
app.get('/', (req, res) => {
  res.json({ status: 'API is running successfully!' });
});

// 1. GET /api/posts - Fetch all public posts
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

// 2. GET /api/posts/:id - Get Single Post Details + Author Info + Likes/Saves
app.get('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const currentUserId = 1; // Temporary active user ID

  try {
    const postQuery = `
      SELECT 
        p.post_id, p.title, p.content, p.excerpt, p.created_at, p.is_private,
        u.user_id AS author_id, u.username, u.display_name, u.bio, u.avatar_url,
        (SELECT COUNT(*) FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*) FROM comments WHERE post_id = p.post_id) AS comments_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = $1) AS is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.post_id AND user_id = $1) AS is_saved,
        EXISTS(SELECT 1 FROM user_follows WHERE follower_id = $1 AND following_id = u.user_id) AS is_following_author
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.post_id = $2;
    `;
    const result = await pool.query(postQuery, [currentUserId, postId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Essay not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// 3. POST /api/posts - Create a new post
app.post('/api/posts', async (req, res) => {
  try {
    const { user_id, title, content, excerpt, is_private } = req.body;
    
    const newPost = await pool.query(
      `INSERT INTO posts (user_id, title, content, excerpt, is_private) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id || 1, title, content, excerpt, is_private || false]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// --- FEED SYSTEM ---

// GET /api/feed - Fetch feed posts with Likes & Saves state
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

// POST /api/posts/:id/like - Toggle Like
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
      res.json({ isLiked: false });
    } else {
      await pool.query(`INSERT INTO post_likes (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      res.json({ isLiked: true });
    }
  } catch (err) {
    console.error('Error toggling like:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/posts/:id/save - Toggle Save/Bookmark
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
      res.json({ isSaved: false });
    } else {
      await pool.query(`INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      res.json({ isSaved: true });
    }
  } catch (err) {
    console.error('Error toggling save:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- COMMENTS ENDPOINTS ---

// GET /api/posts/:id/comments - Get Comments for an Essay
app.get('/api/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
    const query = `
      SELECT c.comment_id, c.content, c.created_at, u.username, u.display_name 
      FROM comments c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.post_id = $1
      ORDER BY c.created_at DESC;
    `;
    const result = await pool.query(query, [postId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching comments:', err);
    res.status(500).json({ message: 'Server error fetching comments' });
  }
});

// POST /api/posts/:id/comments - Add Comment
app.post('/api/posts/:id/comments', async (req, res) => {
  const postId = req.params.id;
  const { content } = req.body;
  const userId = 1;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment cannot be empty' });
  }

  try {
    const insertQuery = `
      INSERT INTO comments (post_id, user_id, content) 
      VALUES ($1, $2, $3) 
      RETURNING comment_id, content, created_at;
    `;
    const newComment = await pool.query(insertQuery, [postId, userId, content.trim()]);
    
    const userQuery = 'SELECT username, display_name FROM users WHERE user_id = $1';
    const userResult = await pool.query(userQuery, [userId]);

    res.json({
      ...newComment.rows[0],
      username: userResult.rows[0].username,
      display_name: userResult.rows[0].display_name,
    });
  } catch (err) {
    console.error('Error creating comment:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// --- USER & FOLLOW SYSTEM ---

// GET /api/users/:username - Author Profile
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

// POST /api/users/:id/follow - Follow/Unfollow
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

// GET /api/users/:id/following - List following
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

// GET /api/dashboard/stats - Clean, non-duplicate query returning received likes, saved posts, and liked posts (likes given)
app.get('/api/dashboard/stats', async (req, res) => {
  const userId = 1;

  try {
    // 1. Likes received on user's posts
    const likesReceived = await pool.query(
      `SELECT COUNT(*) FROM post_likes pl JOIN posts p ON pl.post_id = p.post_id WHERE p.user_id = $1`,
      [userId]
    );

    // 2. Saved/Bookmarked posts
    const savedPosts = await pool.query(
      `SELECT p.post_id, p.title, p.excerpt, p.created_at, u.username, u.display_name 
       FROM saved_posts sp
       JOIN posts p ON sp.post_id = p.post_id
       JOIN users u ON p.user_id = u.user_id
       WHERE sp.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    // 3. Posts liked by current user (Likes Given)
    const likedPosts = await pool.query(
      `SELECT p.post_id, p.title, p.excerpt, p.created_at, u.username, u.display_name 
       FROM post_likes pl
       JOIN posts p ON pl.post_id = p.post_id
       JOIN users u ON p.user_id = u.user_id
       WHERE pl.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );

    res.json({
      totalLikesReceived: parseInt(likesReceived.rows[0].count, 10) || 0,
      savedPosts: savedPosts.rows,
      likedPosts: likedPosts.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// --- MY POSTS ENDPOINT ---

// GET /api/posts/my-posts - Fetch essays authored by active user
app.get('/api/posts/my-posts', async (req, res) => {
  const userId = 1; // Temporary active user ID

  try {
    const query = `
      SELECT 
        p.post_id, p.title, p.excerpt, p.is_private, p.created_at,
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
    res.status(500).json({ message: 'Server error' });
  }
});

// --- VISIBILITY & DELETE ENDPOINTS ---

// PATCH /api/posts/:id/visibility - Toggle Post Public/Private Status
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

// DELETE /api/posts/:id - Delete Essay
app.delete('/api/posts/:id', async (req, res) => {
  const postId = req.params.id;
  const userId = 1;

  try {
    // Delete dependent relationships first (likes, comments, saved_posts) if foreign keys lack ON DELETE CASCADE
    await pool.query(`DELETE FROM post_likes WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM saved_posts WHERE post_id = $1`, [postId]);
    await pool.query(`DELETE FROM comments WHERE post_id = $1`, [postId]);

    const result = await pool.query(
      `DELETE FROM posts WHERE post_id = $1 AND user_id = $2 RETURNING *`,
      [postId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized' });
    }

    res.json({ message: 'Post deleted successfully' });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error' });
  }
});