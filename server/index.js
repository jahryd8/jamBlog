const express = require('express');
const cors = require('cors');
const pool = require('./db');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Allows your Vite React app (port 5173) to talk to Express (port 5000)
app.use(express.json()); // Parses incoming JSON bodies from request

// --- REST API ENDPOINTS ---

// message to check if the API is running while while http://localhost:5000/api/posts returns post data.
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

// 2. GET /api/posts/:id - Fetch a single post by ID
app.get('/api/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT posts.*, users.username, users.display_name 
       FROM posts 
       JOIN users ON posts.user_id = users.user_id 
       WHERE post_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: 'Server error while fetching post' });
  }
});

// 3. POST /api/posts - Create a new post from CreateStudio
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

// Start Express Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

//Authour Profile & Follow System

// 1. Get Author Profile Data & Published Posts
app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  const currentUserId = 1; // Temporary active user ID until auth is added

  try {
    // Fetch user details + follower counts
    const userQuery = `
      SELECT 
        u.user_id, 
        u.username, 
        u.display_name, 
        u.bio, 
        u.location, 
        u.avatar_url,
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

    // Fetch posts written by this user
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

// 2. Toggle Follow / Unfollow Author
app.post('/api/users/:id/follow', async (req, res) => {
  const targetUserId = parseInt(req.params.id);
  const followerId = 1; // Temporary logged-in user

  if (followerId === targetUserId) {
    return res.status(400).json({ message: "You can't follow yourself" });
  }

  try {
    // Check if already following
    const checkQuery = `
      SELECT * FROM user_follows 
      WHERE follower_id = $1 AND following_id = $2;
    `;
    const checkResult = await pool.query(checkQuery, [followerId, targetUserId]);

    if (checkResult.rows.length > 0) {
      // Unfollow
      await pool.query(
        `DELETE FROM user_follows WHERE follower_id = $1 AND following_id = $2;`,
        [followerId, targetUserId]
      );
      res.json({ isFollowing: false });
    } else {
      // Follow
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


// Feed, Like & Save Endpoints

// 1. GET /api/feed - Fetch feed posts with Likes & Saves state
app.get('/api/feed', async (req, res) => {
  const currentUserId = 1; // Temporary active user ID
  const filter = req.query.filter || 'all'; // 'all' or 'following'

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

// 2. POST /api/posts/:id/like - Toggle Like
app.post('/api/posts/:id/like', async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = 1;

  try {
    const check = await pool.query(
      `SELECT * FROM post_likes WHERE user_id = $1 AND post_id = $2`,
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

// 3. POST /api/posts/:id/save - Toggle Save/Bookmark
app.post('/api/posts/:id/save', async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = 1;

  try {
    const check = await pool.query(
      `SELECT * FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
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

// Following & Followers Endpoints

// GET /api/users/:id/following - Get all accounts user is following
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