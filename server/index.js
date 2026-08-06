import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;

if (!process.env.JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// PostgreSQL Connection Pool Configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

pool.on('connect', () => {
  console.log('PostgreSQL database pool initialized.');
});

// AutoCreate Tables if they don't exist
const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS posts (
        post_id SERIAL PRIMARY KEY,
        user_id INT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        is_private BOOLEAN DEFAULT FALSE,
        is_draft BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database tables verified successfully.');
  } catch (err) {
    console.error('Error initializing database tables:', err);
  }
};

initDb();

// --- CORS Configuration ---
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.CLIENT_ORIGIN,
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    const isAllowed = allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin);
    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violation: Access from this origin is blocked.'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// --- Helper Functions & Middleware ---
const getUserIdFromReq = (req) => req.user?.user_id || req.user?.userId || req.user?.id;

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token.' });
    }
    req.user = user;
    next();
  });
};

const sanitizeUser = (user) => {
  const { password_hash, ...safeUser } = user;
  return safeUser;
};

// --- Routes ---

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, display_name } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email, and password are required.' });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters long.' });
  }

  try {
    const existing = await pool.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [username.trim(), email.trim()]
    );

    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username or email is already in use.' });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name)
       VALUES ($1, $2, $3, $4)
       RETURNING user_id, username, email, display_name, bio, avatar_url, role`,
      [username.trim(), email.trim(), hashedPassword, (display_name || username).trim()]
    );

    const user = newUser.rows[0];

    const token = jwt.sign(
      { user_id: user.user_id, userId: user.user_id, username: user.username, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ user, token });
  } catch (err) {
    console.error('Registration error details:', err);
    res.status(500).json({ message: 'Server error during registration.', error: err.message });
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { emailOrUsername, email, password } = req.body;
  const identifier = emailOrUsername || email;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/Username and password are required.' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 OR username = $1',
      [identifier.trim()]
    );
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, userId: user.user_id, username: user.username, role: user.role || 'user' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ user: sanitizeUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error during login.' });
  }
});

// Get Current User
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const targetId = getUserIdFromReq(req);

    if (!targetId) {
      return res.status(400).json({ message: 'Invalid token payload.' });
    }

    const result = await pool.query(
      'SELECT user_id, username, email, display_name, bio, avatar_url, role FROM users WHERE user_id = $1',
      [targetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Auth /me error details:', err);
    res.status(500).json({ message: 'Failed to retrieve user session.' });
  }
});

// Publication Feed (Excludes drafts & private posts)
app.get('/api/feed', async (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 5;
  const offset = (page - 1) * limit;

  try {
    const result = await pool.query(
      `SELECT 
        p.post_id, 
        p.title, 
        COALESCE(p.excerpt, LEFT(p.content, 200)) AS excerpt, 
        p.created_at, 
        u.username, 
        u.display_name,
        COALESCE(COUNT(l.like_id), 0)::text AS likes_count,
        FALSE AS is_liked,
        FALSE AS is_saved
       FROM posts p
       JOIN users u ON p.user_id = u.user_id
       LEFT JOIN post_likes l ON p.post_id = l.post_id
       WHERE p.is_draft = false AND p.is_private = false
       GROUP BY p.post_id, u.user_id
       ORDER BY p.created_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Feed error details:', err);
    res.status(500).json({ message: 'Error fetching publication feed.' });
  }
});

// Fetch User's Own Posts (Dashboard)
app.get('/api/posts/my-posts', authenticateToken, async (req, res) => {
  const userId = getUserIdFromReq(req);

  try {
    const query = `
      SELECT 
        p.post_id, 
        p.title, 
        COALESCE(p.excerpt, LEFT(p.content, 200)) AS excerpt, 
        COALESCE(p.is_private, p.is_draft, false) AS is_private, 
        p.is_draft,
        p.created_at,
        COALESCE(COUNT(DISTINCT l.like_id), 0)::text AS likes_count,
        COALESCE(COUNT(DISTINCT c.comment_id), 0)::text AS comments_count
      FROM posts p
      LEFT JOIN post_likes l ON p.post_id = l.post_id
      LEFT JOIN comments c ON p.post_id = c.post_id
      WHERE p.user_id = $1
      GROUP BY p.post_id
      ORDER BY p.created_at DESC;
    `;

    const result = await pool.query(query, [userId]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching my-posts:', err);
    res.status(500).json({ message: 'Failed to fetch user posts.' });
  }
});

// Fetch Dashboard User Stats & Saved Posts
app.get('/api/dashboard/stats', authenticateToken, async (req, res) => {
  const userId = getUserIdFromReq(req);

  try {
    const likesReceivedRes = await pool.query(
      'SELECT COUNT(*) FROM post_likes l JOIN posts p ON l.post_id = p.post_id WHERE p.user_id = $1',
      [userId]
    );

    const likesGivenRes = await pool.query(
      'SELECT COUNT(*) FROM post_likes WHERE user_id = $1',
      [userId]
    );

    const savedPostsRes = await pool.query(
      `SELECT s.post_id, p.title, COALESCE(p.excerpt, LEFT(p.content, 200)) AS excerpt, s.created_at, u.username, u.display_name
       FROM saved_posts s
       JOIN posts p ON s.post_id = p.post_id
       JOIN users u ON p.user_id = u.user_id
       WHERE s.user_id = $1`,
      [userId]
    );

    res.json({
      totalLikesReceived: parseInt(likesReceivedRes.rows[0]?.count || 0, 10),
      totalLikesGiven: parseInt(likesGivenRes.rows[0]?.count || 0, 10),
      savedPosts: savedPostsRes.rows,
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats.' });
  }
});

// Create Post or Save Draft
app.post('/api/posts', authenticateToken, async (req, res) => {
  const { title, content, excerpt, is_private, is_draft } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const userId = getUserIdFromReq(req);
  if (!userId) {
    return res.status(401).json({ message: 'Unauthorized: User ID missing from token.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO posts (user_id, title, content, excerpt, is_private, is_draft)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING post_id, user_id, title, content, excerpt, is_private, is_draft, created_at, updated_at`,
      [
        userId,
        title.trim(),
        content.trim(),
        (excerpt || title).trim(),
        Boolean(is_private),
        Boolean(is_draft),
      ]
    );

    return res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Database Error in POST /api/posts:', err);
    return res.status(500).json({ message: 'Failed to create post.', error: err.message });
  }
});

// Fetch Single Post
app.get('/api/posts/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT post_id AS id, post_id, user_id, title, content, excerpt, is_private, is_draft, created_at 
       FROM posts 
       WHERE post_id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching post:', err);
    return res.status(500).json({ message: 'Failed to fetch post.' });
  }
});

// Update Post / Draft
app.put('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, is_private, is_draft } = req.body;
  const userId = getUserIdFromReq(req);

  try {
    const result = await pool.query(
      `UPDATE posts 
       SET title = $1, content = $2, excerpt = $3, is_private = $4, is_draft = $5, updated_at = NOW()
       WHERE post_id = $6 AND user_id = $7
       RETURNING *`,
      [title, content, excerpt || title, Boolean(is_private), Boolean(is_draft), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Database Error in PUT /api/posts/:id:', err);
    return res.status(500).json({ message: 'Failed to update post.', error: err.message });
  }
});

// Toggle Post Visibility / Draft Status
app.patch('/api/posts/:id/visibility', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { is_private } = req.body;
  const userId = getUserIdFromReq(req);

  try {
    const result = await pool.query(
      `UPDATE posts 
       SET is_private = $1, is_draft = $1, updated_at = NOW() 
       WHERE post_id = $2 AND user_id = $3 
       RETURNING *`,
      [Boolean(is_private), id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized.' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Error updating visibility:', err);
    return res.status(500).json({ message: 'Failed to update post visibility.' });
  }
});

// Delete Post
app.delete('/api/posts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const userId = getUserIdFromReq(req);

  try {
    const result = await pool.query(
      'DELETE FROM posts WHERE post_id = $1 AND user_id = $2 RETURNING post_id',
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Post not found or unauthorized.' });
    }

    res.json({ message: 'Post deleted successfully.' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ message: 'Failed to delete post.' });
  }
});

// Delete User Account
app.delete('/api/users/account', authenticateToken, async (req, res) => {
  const userId = getUserIdFromReq(req);

  try {
    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.json({ message: 'Account deleted successfully.' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ message: 'Failed to delete account.' });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(500).json({ message: err.message || 'Internal server error.' });
});

// Bind to Port
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});