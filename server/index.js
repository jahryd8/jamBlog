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