import React, { useState } from 'react';
import axios from 'axios';

const SendNotificationForm = () => {
  const [token, setToken] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [response, setResponse] = useState('');

  const handleSend = async () => {
    if (!token || !title || !body) return alert('All fields are required!');
    try {
      const res = await axios.post('http://localhost:5000/send', {
        token,
        title,
        body,
      });
      setResponse('✅ Notification Sent!');
    } catch (err) {
      setResponse('❌ Failed to send.');
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4 bg-white shadow-xl rounded-2xl mt-10">
      <h1 className="text-2xl font-bold mb-4 text-center">Master Admin Panel</h1>
      <input
        type="text"
        placeholder="FCM Token"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        className="w-full mb-3 p-2 border rounded"
      />
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
