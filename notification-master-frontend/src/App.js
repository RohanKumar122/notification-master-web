import React, { useState, useEffect } from 'react';
import axios from 'axios';
// require('dotenv').config();

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000';



// BACKEND_URL = 'http://localhost:5000';
// const BACKEND_URL = 'https://master-slave-notification.vercel.app';
const SendNotificationForm = () => {
  const [tokens, setTokens] = useState([]);
  const [selectedToken, setSelectedToken] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    axios.get(`${BACKEND_URL}/api/tokens`)
      .then(res => {
        setTokens(res.data.tokens);
      })
      .catch(err => console.error('Failed to fetch tokens:', err));
  }, []);

  const handleSend = async () => {
    if (!selectedToken || !title || !body) return alert('All fields are required!');

    const payloads = selectedToken === 'all'
      ? tokens.map(t => axios.post(`${BACKEND_URL}/api/send`, {
          token: t.token,
          title,
          body,
        }))
      : [axios.post(`${BACKEND_URL}/api/send`, { token: selectedToken, title, body })];

    try {
      await Promise.all(payloads);
      setResponse('✅ Notification Sent!');
    } catch (err) {
      setResponse('❌ Failed to send.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-xl rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Master Admin Panel</h1>

      <select
        value={selectedToken}
        onChange={(e) => setSelectedToken(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      >
        <option value="">Select Token</option>
        <option value="all">Broadcast to All</option>
        {tokens.map((t, i) => (
          <option key={i} value={t.token}>
            {t.name.substring(0, 30)}
          </option>
        ))}
      </select>

      <input
        type="text"
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <textarea
        placeholder="Message"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />

      <button
        onClick={handleSend}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Send Notification
      </button>

      {response && <p className="mt-4 text-center">{response}</p>}
    </div>
  );
};

export default SendNotificationForm;
