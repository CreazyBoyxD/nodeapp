import express from 'express';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Configure database connection
const db = mysql.createPool({
  host: '157.173.209.189',
  user: 'u690920680_seitarou',
  password: '180223Sk',
  database: 'u690920680_seitarou',
  port: 3306, // Default MySQL port
  waitForConnections: true, // Important to avoid connection errors
  connectionLimit: 10, // Adjust based on your needs
  queueLimit: 0
});

const SELLIX_API_TOKEN = 'yRU9NTzHjWV23CrVCu9CTU4MnlnpstBVVM4ZycSMR2XWnygfShYbYIW8KZ1dH3lj';

// Endpoint to retrieve the Sellix API token
app.get('/sellix-token', (req, res) => {
  res.json({ token: SELLIX_API_TOKEN });
});

db.query('SELECT 1')
  .then(() => console.log('Database connected successfully'))
  .catch(err => console.error('Database connection failed:', err));

// Register user
app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10); // Increased salt rounds for more security

  try {
    const [result] = await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    const token = jwt.sign({ id: result.insertId }, 'BWqg5jstKY2WkysLZFDd', {
      expiresIn: 86400
    });

    res.status(200).json({ auth: true, token });
  } catch (err) {
    console.error('Error registering user:', err.message);
    res.status(500).json({ error: 'Error registering user', details: err.message });
  }
});

// Login user
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const [results] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (results.length === 0) return res.status(404).json({ error: 'User not found' });

    const user = results[0];
    const passwordIsValid = bcrypt.compareSync(password, user.password);

    if (!passwordIsValid) return res.status(401).json({ auth: false, token: null });

    const token = jwt.sign({ id: user.id }, 'your_secret_key', { // Update with your secret key
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({ auth: true, token });
  } catch (err) {
    console.error('Error logging in user:', err.message);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Endpoint to fetch all games
app.get('/gdata', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM gdata');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching gdata:', err.message);
    res.status(500).json({ error: 'Error fetching gdata', details: err.message });
  }
});

// Endpoint to fetch game by ID
app.get('/gdata/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [game] = await db.query('SELECT * FROM gdata WHERE id = ?', [id]);

    if (game.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.json(game[0]);
  } catch (err) {
    console.error('Error fetching game:', err.message);
    res.status(500).json({ error: 'Error fetching game', details: err.message });
  }
});

// Endpoint to add a new game
app.post('/gdata', async (req, res) => {
  const {
    name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5,
    screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals,
    loot, radar, misc
  } = req.body;

  if (!name || !game || !price || !description) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO gdata (name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals, loot, radar, misc) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals, loot, radar, misc]
    );

    res.status(201).json({ id: result.insertId, name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals, loot, radar, misc });
  } catch (err) {
    console.error('Error adding game:', err.message);
    res.status(500).json({ error: 'Error adding game', details: err.message });
  }
});

// Endpoint to update a game
app.put('/gdata/:id', async (req, res) => {
  const { id } = req.params;
  const {
    name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5,
    screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals,
    loot, radar, misc
  } = req.body;

  if (!name || !game || !price || !description) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const [existingGame] = await db.query('SELECT * FROM gdata WHERE id = ?', [id]);

    if (existingGame.length === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    await db.query(
      'UPDATE gdata SET name = ?, game = ?, image = ?, price = ?, description = ?, detection = ?, screenshot1 = ?, screenshot2 = ?, screenshot3 = ?, screenshot4 = ?, screenshot5 = ?, screenshot6 = ?, game_client = ?, processor = ?, system_requirements = ?, window_mode = ?, spoofer = ?, usb_presence = ?, aimbot = ?, visuals = ?, loot = ?, radar = ?, misc = ? WHERE id = ?',
      [name, game, image, price, description, detection, screenshot1, screenshot2, screenshot3, screenshot4, screenshot5, screenshot6, game_client, processor, system_requirements, window_mode, spoofer, usb_presence, aimbot, visuals, loot, radar, misc, id]
    );

    res.status(200).json({ message: 'Game updated successfully' });
  } catch (err) {
    console.error('Error updating game:', err.message);
    res.status(500).json({ error: 'Error updating game', details: err.message });
  }
});

// Endpoint to delete a game
app.delete('/gdata/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.query('DELETE FROM gdata WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Game not found' });
    }

    res.status(200).json({ message: 'Game deleted successfully' });
  } catch (err) {
    console.error('Error deleting game:', err.message);
    res.status(500).json({ error: 'Error deleting game', details: err.message });
  }
});

// Start the server
app.listen(3002, () => {
  console.log('Server started on port 3002');
});