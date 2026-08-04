import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js'; // your db pool
import { sendWelcomeEmail } from '../utils/sendEmail.js';

export const register = async (req, res) => {
  const { username, email, password, display_name } = req.body;

  try {
    // 1. Check existing user
    const existing = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: 'Username or Email already taken.' });
    }

    // 2. Hash & Insert
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, display_name) 
       VALUES ($1, $2, $3, $4) RETURNING user_id, username, email, display_name`,
      [username, email, hashedPassword, display_name]
    );

    const newUser = result.rows[0];

    // 3. Trigger email asynchronously (does not block HTTP response)
    sendWelcomeEmail(newUser.email, newUser.display_name || newUser.username);

    // 4. Generate Token & Respond
    const token = jwt.sign({ user_id: newUser.user_id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({ token, user: newUser });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration.' });
  }
};