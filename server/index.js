import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from './db.js';
import authenticateToken from './middleware/auth.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
const corsOptions = {
  origin: ['http://localhost:5173', 'https://jam-blog-rosy.vercel.app'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// --- HEALTH CHECK ---
app.get('/', (req, res) => {
  res.json({ status: 'API is running successfully!' });
});

// --- AUTHENTICATION & ACCOUNT ENDPOINTS ---

// Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required' });
  }

  try {
    const existing = await pool.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [username.trim(), email.trim()]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email is already in use' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, display_name, bio, avatar_url`,
      [username.trim(), email.trim(), hashedPassword, display_name || username.trim()]
    );

    const user = newUser.rows[0];

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { emailOrUsername, password } = req.body;

  if (!emailOrUsername || !password) {
    return res.status(400).json({ message: 'Email/Username and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [emailOrUsername.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    delete user.password_hash;

    res.json({ user, token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get Current Logged-in Session
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, username, email, display_name, bio, avatar_url FROM users WHERE user_id = $1',
      [req.user.user_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Session error:', err);
    res.status(500).json({ message: 'Server error fetching user session' });
  }
});

// PUT /api/users/profile - Update Logged-in User Profile
app.put('/api/users/profile', authenticateToken, async (req, res) => {
  const { display_name, bio } = req.body;
  const userId = req.user.user_id;

  try {
    const result = await pool.query(
      `UPDATE users 
       SET display_name = COALESCE($1, display_name), 
           bio = COALESCE($2, bio) 
       WHERE user_id = $3 
       RETURNING user_id, username, email, display_name, bio, avatar_url`,
      [display_name, bio, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

// DELETE /api/users/account - Delete Logged-in User Account
app.delete('/api/users/account', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    // Delete cascading relational records
    await pool.query('DELETE FROM post_likes WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM saved_posts WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM comments WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_follows WHERE follower_id = $1 OR following_id = $1', [userId]);
    await pool.query('DELETE FROM posts WHERE user_id = $1', [userId]);

    // Delete user
    const result = await pool.query('DELETE FROM users WHERE user_id = $1 RETURNING *', [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error deleting account' });
  }
});

// PUT /api/users/change-password
app.put('/api/users/change-password', authenticateToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.user_id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Current and new passwords are required.' });
  }

  try {
    // 1. Fetch user to verify current password
    const userResult = await pool.query('SELECT password_hash FROM users WHERE user_id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const validPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!validPassword) {
      return res.status(400).json({ message: 'Incorrect current password.' });
    }

    // 2. Hash new password and update
    const newHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE user_id = $2', [newHash, userId]);

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ message: 'Server error updating password.' });
  }
});


// --- ESSAYS & POSTS ENDPOINTS ---

// 1. GET /api/posts/my-posts
app.get('/api/posts/my-posts', authenticateToken, async (req, res) => {
  const userId = req.user.user_id;

  try {
    const query = `
      SELECT 
        p.post_id, 
        p.title, 
        p.excerpt, 
        p.is_private, 
        p.is_draft,
        p.created_at,
        (SELECT COUNT(*)::INT FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*)::INT FROM comments WHERE post_id = p.post_id) AS comments_count
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

// 2. GET /api/posts - Fetch all public, published posts
app.get('/api/posts', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT posts.*, users.username, users.display_name 
       FROM posts 
       JOIN users ON posts.user_id = users.user_id 
       WHERE posts.is_private = false AND posts.is_draft = false 
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
  const authHeader = req.headers['authorization'];
  let currentUserId = null;

  // Optional JWT detection for personalized fields (liked/bookmarked status)
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.user_id;
    } catch (e) {
      // Ignore token error if viewing public post anonymously
    }
  }

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
        p.is_draft,
        p.user_id AS author_id, 
        COALESCE(u.username, 'Anonymous') AS username, 
        COALESCE(u.display_name, 'Author') AS display_name, 
        u.bio, 
        u.avatar_url,
        (SELECT COUNT(*)::INT FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        (SELECT COUNT(*)::INT FROM comments WHERE post_id = p.post_id) AS comments_count,
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
app.post('/api/posts', authenticateToken, async (req, res) => {
  try {
    const { title, content, excerpt, is_private, is_draft } = req.body;
    const activeUserId = req.user.user_id;

    const draftStatus = typeof is_draft === 'boolean' ? is_draft : false;
    const privateStatus = typeof is_private === 'boolean' ? is_private : false;

    const newPost = await pool.query(
      `INSERT INTO posts (user_id, title, content, excerpt, is_private, is_draft) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [
        activeUserId,
        title,
        content,
        excerpt || content?.slice(0, 150),
        privateStatus,
        draftStatus
      ]
    );

    res.status(201).json(newPost.rows[0]);
  } catch (err) {
    console.error('Error creating post:', err.message);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

// 5. PATCH /api/posts/:id/visibility - Toggle Public/Private
app.patch('/api/posts/:id/visibility', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const { is_private } = req.body;
  const userId = req.user.user_id;

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
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = req.params.id;
  const userId = req.user.user_id;

  try {
    const checkPost = await pool.query('SELECT user_id FROM posts WHERE post_id = $1', [postId]);
    if (checkPost.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (checkPost.rows[0].user_id !== userId) {
      return res.status(403).json({ message: 'Unauthorized to delete this post' });
    }

    await pool.query('DELETE FROM post_likes WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM saved_posts WHERE post_id = $1', [postId]);
    await pool.query('DELETE FROM comments WHERE post_id = $1', [postId]);

    const result = await pool.query(
      'DELETE FROM posts WHERE post_id = $1 AND user_id = $2 RETURNING *',
      [postId, userId]
    );

    res.json({ message: 'Post deleted successfully', deletedPostId: postId });
  } catch (err) {
    console.error('Error deleting post:', err);
    res.status(500).json({ message: 'Server error while deleting essay' });
  }
});

// PUT /api/posts/:id - Edit / Update Essay
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { title, content, excerpt, is_private, is_draft } = req.body;
  const userId = req.user.user_id;

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid Post ID' });
  }

  if (!title || !title.trim() || !content || !content.trim()) {
    return res.status(400).json({ message: 'Title and content cannot be empty' });
  }

  try {
    const updatedExcerpt = excerpt || content.slice(0, 150);

    const result = await pool.query(`
      UPDATE posts 
      SET 
        title = $1, 
        content = $2, 
        excerpt = $3, 
        is_private = COALESCE($4, is_private),
        is_draft = COALESCE($5, is_draft),
        updated_at = CURRENT_TIMESTAMP
      WHERE post_id = $6 AND user_id = $7
      RETURNING *
    `, [
      title.trim(),
      content.trim(),
      updatedExcerpt,
      is_private,
      is_draft,
      postId,
      userId
    ]);

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
  const authHeader = req.headers['authorization'];
  let currentUserId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.user_id;
    } catch (e) {
      // Allow guest usage
    }
  }

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
        (SELECT COUNT(*)::INT FROM post_likes WHERE post_id = p.post_id) AS likes_count,
        EXISTS(SELECT 1 FROM post_likes WHERE post_id = p.post_id AND user_id = $1) AS is_liked,
        EXISTS(SELECT 1 FROM saved_posts WHERE post_id = p.post_id AND user_id = $1) AS is_saved
      FROM posts p
      JOIN users u ON p.user_id = u.user_id
      WHERE p.is_private = false AND p.is_draft = false
    `;

    if (filter === 'following' && currentUserId) {
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
app.post('/api/posts/:id/like', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

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

const handleSaveToggle = async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const userId = req.user.user_id;

  try {
    const check = await pool.query(
      `SELECT 1 FROM saved_posts WHERE user_id = $1 AND post_id = $2`,
      [userId, postId]
    );

    if (check.rows.length > 0) {
      await pool.query(`DELETE FROM saved_posts WHERE user_id = $1 AND post_id = $2`, [userId, postId]);
      res.json({ bookmarked: false, is_saved: false, is_bookmarked: false });
    } else {
      await pool.query(`INSERT INTO saved_posts (user_id, post_id) VALUES ($1, $2)`, [userId, postId]);
      res.json({ bookmarked: true, is_saved: true, is_bookmarked: true });
    }
  } catch (err) {
    console.error('Error toggling save/bookmark:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

app.post('/api/posts/:id/save', authenticateToken, handleSaveToggle);
app.post('/api/posts/:id/bookmark', authenticateToken, handleSaveToggle);


// --- COMMENTS ENDPOINTS ---
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

app.post('/api/posts/:id/comments', authenticateToken, async (req, res) => {
  const postId = parseInt(req.params.id, 10);
  const { content, parent_comment_id, parent_id } = req.body;
  const currentUserId = req.user.user_id; 

  if (isNaN(postId)) {
    return res.status(400).json({ message: 'Invalid Post ID parameter' });
  }

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Comment content cannot be empty' });
  }

  const rawParent = parent_comment_id !== undefined ? parent_comment_id : parent_id;
  const parentId = (rawParent && !isNaN(parseInt(rawParent, 10))) 
    ? parseInt(rawParent, 10) 
    : null;

  try {
    const postCheck = await pool.query('SELECT post_id FROM posts WHERE post_id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: 'Target post does not exist' });
    }

    const commentRes = await pool.query(`
      INSERT INTO comments (post_id, user_id, content, parent_comment_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `, [postId, currentUserId, content.trim(), parentId]);

    const newComment = commentRes.rows[0];

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

app.patch('/api/comments/:commentId', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.commentId, 10);
  const { content } = req.body;
  const userId = req.user.user_id;

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    const result = await pool.query(`
      UPDATE comments 
      SET content = $1
      WHERE comment_id = $2 AND user_id = $3
      RETURNING *
    `, [content, commentId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating comment:', err);
    res.status(500).json({ message: 'Failed to update comment' });
  }
});

app.delete('/api/comments/:comment_id', authenticateToken, async (req, res) => {
  const commentId = parseInt(req.params.comment_id, 10);
  const userId = req.user.user_id;

  if (isNaN(commentId)) {
    return res.status(400).json({ message: 'Invalid comment ID' });
  }

  try {
    const result = await pool.query('DELETE FROM comments WHERE comment_id = $1 AND user_id = $2 RETURNING *', [commentId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Comment not found or unauthorized' });
    }

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (err) {
    console.error('Error deleting comment:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});


// --- USER & FOLLOW SYSTEM ---
app.get('/api/users/:username', async (req, res) => {
  const { username } = req.params;
  const authHeader = req.headers['authorization'];
  let currentUserId = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      currentUserId = decoded.user_id;
    } catch (e) {
      // Optional authentication
    }
  }

  try {
    const userQuery = `
      SELECT 
        u.user_id, u.username, u.display_name, u.bio, u.location, u.avatar_url,
        (SELECT COUNT(*)::INT FROM user_follows WHERE following_id = u.user_id) AS followers_count,
        (SELECT COUNT(*)::INT FROM user_follows WHERE follower_id = u.user_id) AS following_count,
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
      WHERE user_id = $1 AND is_private = false AND is_draft = false
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

app.post('/api/users/:id/follow', authenticateToken, async (req, res) => {
  const targetUserId = parseInt(req.params.id, 10);
  const followerId = req.user.user_id;

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
      WHERE p.is_private = false AND p.is_draft = false
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
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const currentUserId = req.user.user_id;

  try {
    const receivedRes = await pool.query(
      `SELECT COUNT(*)::INT FROM post_likes pl 
       JOIN posts p ON pl.post_id = p.post_id 
       WHERE p.user_id = $1`,
      [currentUserId]
    );

    const givenRes = await pool.query(
      `SELECT COUNT(*)::INT FROM post_likes WHERE user_id = $1`,
      [currentUserId]
    );

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
      totalLikesReceived: receivedRes.rows[0].count || 0,
      totalLikesGiven: givenRes.rows[0].count || 0,
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