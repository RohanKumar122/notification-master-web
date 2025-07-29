// api/index.js
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const admin = require("firebase-admin");
const connectDB = require("./db");
require("dotenv").config({ path: "../.env", override: true });

const app = express();
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());

// ✅ Firebase Admin initialization
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
    console.log("✅ Firebase Admin Initialized");
  } catch (err) {
    console.error("❌ Firebase Admin Init Error:", err);
  }
}

// ✅ Middleware for MongoDB
app.use(async (req, res, next) => {
  try {
    const { db } = await connectDB();
    req.tokensCol = db.collection("tokens");
    next();
  } catch (err) {
    console.error("❌ MongoDB Connection Error:", err);
    res.status(500).send({ success: false, error: "DB connection failed" });
  }
});

// ✅ Routes
app.get("/api/status", async (req, res) => {
  try {
    await req.tokensCol.findOne({});
    res.status(200).send({ success: true, message: "Server & MongoDB connected" });
  } catch (err) {
    console.error("❌ Status Check Error:", err);
    res.status(500).send({ success: false, message: "MongoDB error" });
  }
});

app.get("/api/tokens", async (req, res) => {
  try {
    const tokens = await req.tokensCol.find().toArray();
    console.log(`📌 Found ${tokens.length} tokens in DB`);
    res.status(200).send({ success: true, tokens });
  } catch (err) {
    console.error("❌ Fetch Tokens Error:", err);
    res.status(500).send({ success: false, error: "Fetch tokens failed" });
  }
});

app.post("/api/register", async (req, res) => {
  const { token, name } = req.body;
  console.log("📥 Register request received:", { name, token: token?.slice(0, 20) + "..." });

  if (!token || !name) {
    return res.status(400).send({ success: false, error: "Token and name are required" });
  }

  try {
    const exists = await req.tokensCol.findOne({ token });
    if (!exists) {
      await req.tokensCol.insertOne({ token, name, createdAt: new Date() });
      console.log(`✅ Token saved for user: ${name}`);
    } else {
      console.log(`ℹ️ Token already exists for: ${name}`);
    }
    res.status(200).send({ success: true, message: "Token registered" });
  } catch (err) {
    console.error("❌ Token Register Error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

app.post('/api/send', async (req, res) => {
  const { title, body, name } = req.body;
  console.log("📩 Send request:", { title, body, name });

  if (!title || !body) {
    return res.status(400).send({ success: false, error: 'Missing title or body' });
  }

  try {
    const query = name ? { name } : {};
    const tokens = await req.tokensCol.find(query).toArray();

    if (tokens.length === 0) {
      return res.status(404).send({ success: false, error: 'No tokens found' });
    }

    console.log(`📌 Query: ${JSON.stringify(query)}, Found tokens: ${tokens.length}`);
    const messages = tokens.map(({ token }) => ({
      token,
      notification: { title, body },
      android: { notification: { sound: 'default' } },
      apns: { payload: { aps: { sound: 'default' } } },
    }));

    const results = await Promise.allSettled(messages.map(m => admin.messaging().send(m)));

    let sent = 0, removed = [];
    for (let i = 0; i < results.length; i++) {
      const resu = results[i];
      const token = messages[i].token;

      if (resu.status === 'fulfilled') {
        console.log(`✅ Sent to token: ${token}`);
        sent++;
      } else {
        console.error(`❌ Error sending to token: ${token}`, resu.reason);

        if (resu.reason.code === 'messaging/registration-token-not-registered') {
          await req.tokensCol.deleteOne({ token });
          removed.push(token);
          console.warn(`⚠️ Removed invalid token: ${token}`);
        }
      }
    }

    res.status(200).send({
      success: true,
      sent,
      removed,
      total: tokens.length,
    });

  } catch (err) {
    console.error("❌ Send error:", err);
    res.status(500).send({ success: false, error: err.message });
  }
});

// ✅ Run locally
if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
}

module.exports = app;
