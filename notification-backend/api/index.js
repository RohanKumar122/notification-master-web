const express = require('express');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
const dotenv = require('dotenv');
const cors = require('cors');

// Load environment variables from parent .env
dotenv.config({ path: '../.env' });

const app = express();
app.use(cors());
app.use(express.json());

// Check if MONGO_URI is defined
if (!process.env.MONGO_URI) {
  throw new Error('❌ MONGO_URI not defined in .env file');
}

// MongoDB setup
const mongoClient = new MongoClient(process.env.MONGO_URI);
let tokensCol;

mongoClient.connect()
  .then(() => {
    const db = mongoClient.db('notification');
    tokensCol = db.collection('tokens');
    console.log('✅ Connected to MongoDB');
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
  });

// Firebase Admin SDK setup
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});

// Health check route
app.get('/status', async (req, res) => {
  try {
    await mongoClient.db('notification').command({ ping: 1 });
    res.status(200).send({
      success: true,
      message: 'Server is running and MongoDB is connected',
    });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: 'Server is running but MongoDB connection failed',
    });
  }
});

// Get all device tokens
app.get('/tokens', async (req, res) => {
  try {
    const tokens = await tokensCol.find().toArray();
    res.status(200).send({ success: true, tokens });
  } catch (err) {
    res.status(500).send({ success: false, error: 'Failed to fetch tokens' });
  }
});

// Register device token
app.post('/register', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).send({ success: false, error: 'Token is required' });
  }

  try {
    const exists = await tokensCol.findOne({ token });
    if (!exists) {
      await tokensCol.insertOne({ token });
    }
    res.status(200).send({ success: true, message: 'Token registered successfully' });
  } catch (err) {
    console.error('Error saving token:', err);
    res.status(500).send({ success: false, error: 'Failed to save token' });
  }
});

// Send push notification
app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).send({ success: false, error: 'Missing required fields' });
  }

  const message = {
    token,
    notification: { title, body },
    android: { notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).send({ success: false, error });
  }
});

// Export for Vercel
module.exports = app;
