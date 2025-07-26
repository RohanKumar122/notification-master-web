// api/index.js

const express = require('express');
const serverless = require('serverless-http');
const bodyParser = require('body-parser');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');
require('dotenv').config({ path: '../.env', override: true });


const app = express();
app.use(cors({
  origin: '*' // Allow all origins
}));
app.use(bodyParser.json());

let tokensCol = null;

// Firebase setup
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

// MongoDB setup
const mongoClient = new MongoClient(process.env.MONGO_URI);
mongoClient.connect().then(() => {
  tokensCol = mongoClient.db('notificationApp').collection('tokens');
});

// Routes
app.get('/api/status', async (req, res) => {
  try {
    await mongoClient.db('notificationApp').command({ ping: 1 });
    res.status(200).send({ success: true, message: 'Server & MongoDB connected' });
  } catch {
    res.status(500).send({ success: false, message: 'MongoDB error' });
  }
});

app.get('/api/tokens', async (req, res) => {
  try {
    const tokens = await tokensCol.find().toArray();
    res.status(200).send({ success: true, tokens });
  } catch {
    res.status(500).send({ success: false, error: 'Fetch tokens failed' });
  }
});

app.post('/api/register', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).send({ success: false, error: 'Token is required' });

  const exists = await tokensCol.findOne({ token });
  if (!exists) await tokensCol.insertOne({ token });
  res.status(200).send({ success: true, message: 'Token registered' });
});

app.post('/api/send', async (req, res) => {
  const { token, title, body } = req.body;
  if (!token || !title || !body) return res.status(400).send({ error: 'Missing fields' });

  const message = {
    token,
    notification: { title, body },
    android: { notification: { sound: 'default' } },
    apns: { payload: { aps: { sound: 'default' } } },
  };

  try {
    const response = await admin.messaging().send(message);
    res.status(200).send({ success: true, response });
  } catch (err) {
    res.status(500).send({ success: false, error: err.message });
  }
});

// Export for Vercel
// module.exports = app;
// module.exports.handler = serverless(app);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});