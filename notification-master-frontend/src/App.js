import React, { useState, useEffect } from "react";
import axios from "axios";
import { RefreshCw } from "lucide-react"; // npm install lucide-react

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:3000";

const SendNotificationForm = () => {
  const [tokens, setTokens] = useState([]);
  const [selectedNames, setSelectedNames] = useState([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTokens = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${BACKEND_URL}/api/tokens`);
      setTokens(res.data.tokens || []);
    } catch (err) {
      console.error("❌ Failed to fetch tokens:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  const handleSelectAll = () => {
    if (selectedNames.length === tokens.length) {
      setSelectedNames([]);
    } else {
      setSelectedNames(tokens.map((t) => t.name));
    }
  };

  const handleCheckboxChange = (name) => {
    setSelectedNames((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const handleSend = async () => {
    if (selectedNames.length === 0 || !title || !body) {
      return alert("⚠️ Please fill all fields and select recipients!");
    }

    try {
      const payload =
        selectedNames.length === tokens.length
          ? { title, body }
          : { title, body, names: selectedNames };

      const res = await axios.post(`${BACKEND_URL}/api/send`, payload);
      const { sent = 0, total = 0, removed = [] } = res.data;
      setResponse(`✅ Sent to ${sent}/${total} users. Removed: ${removed.length}`);
    } catch (err) {
      console.error("❌ Send Error:", err);
      setResponse("❌ Failed to send notification.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-white to-indigo-50 shadow-2xl rounded-2xl mt-10">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-indigo-700 flex items-center gap-2">
          📢 Master Admin Panel
        </h1>
        <button
          onClick={loadTokens}
          className="flex items-center gap-1 px-3 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition"
        >
          <RefreshCw
            className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Select All */}
      <div className="flex items-center mb-4">
        <input
          type="checkbox"
          checked={selectedNames.length === tokens.length && tokens.length > 0}
          onChange={handleSelectAll}
          className="mr-2"
        />
        <span className="font-medium">Select All</span>
        <span className="ml-auto text-sm text-gray-500">
          {selectedNames.length} selected
        </span>
      </div>

      {/* User List */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {tokens.map((t, i) => (
          <label
            key={i}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition ${
              selectedNames.includes(t.name)
                ? "bg-indigo-100 border-indigo-400"
                : "bg-white border-gray-300 hover:border-indigo-300"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedNames.includes(t.name)}
              onChange={() => handleCheckboxChange(t.name)}
              className="mr-2"
            />
            {t.name}
          </label>
        ))}
      </div>

      {/* Title Input */}
      <input
        type="text"
        placeholder="Notification Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
      />

      {/* Body Input */}
      <textarea
        placeholder="Notification Body"
        value={body}
        onChange={(e) => setBody(e.target.value)}
        className="w-full mb-4 p-3 border rounded-lg focus:ring-2 focus:ring-indigo-400"
      />

      {/* Send Button */}
      <button
        onClick={handleSend}
        className="bg-indigo-600 w-full py-3 rounded-lg text-white font-semibold hover:bg-indigo-700 transition"
      >
        Send Notification 🚀
      </button>

      {response && (
        <p className="mt-4 text-center font-medium text-green-600">{response}</p>
      )}
    </div>
  );
};

export default SendNotificationForm;
