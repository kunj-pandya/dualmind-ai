"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [streamResponse, setStreamResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);


  //  Streaming Chat
  const handleStreamChat = async () => {
    if (!message.trim()) return;

    setStreaming(true);
    setStreamResponse("");

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });

      const convId = res.headers.get("x-conversation-id");
      if (convId && !conversationId) {
        setConversationId(convId);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        setStreamResponse((prev) => prev + chunk);
      }
    } catch (error) {
      setStreamResponse("Error: " + error.message);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-gray-100 flex flex-col items-center justify-center p-6 font-sans transition-colors">
      <div className="max-w-2xl w-full bg-[#161b22] p-8 rounded-2xl shadow-xl border border-[#1f6feb]/30">
        <h1 className="text-3xl font-semibold mb-6 text-center text-blue-400">
          DualMind AI
        </h1>

        <textarea
          className="w-full h-32 p-4 mb-4 rounded-xl bg-[#0d1117] border border-[#1f6feb]/40 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          placeholder="Type your message here..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        <div className="flex gap-4 justify-center mb-6">


          <button
            onClick={handleStreamChat}
            disabled={streaming}
            className={`px-6 py-2 rounded-lg font-medium text-white transition-all duration-300 ${streaming
              ? "bg-indigo-800 opacity-60 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
          >
            {streaming ? "Streaming..." : "Stream Chat"}
          </button>
        </div>



        {/* Streaming Chat Response */}
        {streamResponse && (
          <div className="p-4 bg-[#0d1117] border border-[#1f6feb]/30 rounded-lg">
            <p className="text-indigo-300 font-semibold mb-2">
              Response:
            </p>
            <p className="whitespace-pre-wrap text-gray-100 leading-relaxed">
              {streamResponse}
            </p>
          </div>
        )}
      </div>

      <footer className="mt-6 text-sm text-gray-500">
        Built with 💙 Gemini API & Next.js
      </footer>
    </div>
  );
}
