const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config({ path: '../.env' });
 // Adjust path as needed
const admin = require('firebase-admin');
const { MongoClient } = require('mongodb');

// pocess.env file setup
if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_PRIVATE_KEY || !process.env.FIREBASE_CLIENT_EMAIL) {
  console.error('❌ Missing Firebase environment variables. Please check your .env file.');    
}

// MongoDB connection
const mongoClient = new MongoClient(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
let tokensCol;

mongoClient.connect()
  .then(() => {
    const db = mongoClient.db('notificationApp'); // DB name
    tokensCol = db.collection('tokens');
    console.log('✅ MongoDB connected');
  })
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Firebase Admin initialization
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  }),
});


// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json());

// ✅ API to get server status
// ✅ API to get server + MongoDB status
app.get('/status', async (req, res) => {
  try {
    await mongoClient.db('notificationApp').command({ ping: 1 });
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


// Get all registered tokens
app.get('/tokens', async (req, res) => {
  try {
    const tokens = await tokensCol.find().toArray();
    res.status(200).send({ success: true, tokens });
  } catch (err) {
    res.status(500).send({ success: false, error: 'Failed to fetch tokens' });
  }
});


// ✅ API to register device token
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

// ✅ API to send notification
app.post('/send', async (req, res) => {
  const { token, title, body } = req.body;

  if (!token || !title || !body) {
    return res.status(400).send({ error: 'Missing required fields' });
  }

  const message = {
    token: token,
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

// ✅ API to delete a token
// Start server
// app.listen(process.env.PORT || 5000, () => {
//   console.log(`🚀 Server running on port ${process.env.PORT || 5000}`);
// });
