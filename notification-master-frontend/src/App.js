import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

const SendNotificationForm = () => {
  const [tokens, setTokens] = useState([]);
  const [selectedName, setSelectedName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');

  // Load registered users from backend
  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/tokens`)
      .then(res => {
        setTokens(res.data.tokens || []);
      })
      .catch(err => console.error('❌ Failed to fetch tokens:', err));
  }, []);

const handleSend = async () => {
  if (!selectedName || !title || !body) {
    return alert('⚠️ Please fill all fields!');
  }

  try {
    const payload = selectedName === 'all'
      ? { title, body }
      : { title, body, name: selectedName };

    const res = await axios.post(`${BACKEND_URL}/api/send`, payload);

    const { sent = 0, total = 0, removed = [] } = res.data; // ✅ safe defaults

    setResponse(`✅ Sent to ${sent}/${total} users. Removed: ${removed.length}`);
  } catch (err) {
    console.error('❌ Send Error:', err);
    setResponse('❌ Failed to send notification.');
  }
};


  return (
    <div className="max-w-xl mx-auto p-6 bg-white shadow-xl rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center text-indigo-600">📢 Master Admin Panel</h1>

      {/* Dropdown */}
      <select
        value={selectedName}
        onChange={(e) => setSelectedName(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      >
        <option value="">Select Recipient</option>
        <option value="all">🌍 Broadcast to All</option>
        {tokens.map((t, i) => (
          <option key={i} value={t.name}>
            {t.name}
          </option>
        ))}
      </select>

      {/* Title Input */}
      <input
        type="text"
        placeholder="Notification Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      />

      {/* Body Input */}
      <textarea
        placeholder="Notification Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg"
      />

      <button
        onClick={handleSend}
        className="bg-blue-600 w-full py-3 rounded-lg text-white font-semibold hover:bg-blue-700 transition"
      >
        Send Notification
      </button>

      {response && <p className="mt-4 text-center font-medium">{response}</p>}
    </div>
  );
};

export default SendNotificationForm;
