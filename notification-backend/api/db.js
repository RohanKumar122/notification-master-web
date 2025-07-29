// api/db.js
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

async function connectDB() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 30000,
  });

  await client.connect();

  cachedClient = client;
  cachedDb = client.db('notificationApp');

  return { client: cachedClient, db: cachedDb };
}

module.exports = connectDB;
