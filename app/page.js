"use client";

import { useState, useEffect } from "react";



export default function Home() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [streamResponse, setStreamResponse] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const savedConversationId = localStorage.getItem("conversationId");

    if (savedConversationId) {
      setConversationId(savedConversationId);
      loadConversation(savedConversationId);
    }
  }, []);


  const loadConversation = async (id) => {
    try {
      const res = await fetch(`/api/conversation/${id}`);
      const data = await res.json();

      if (data.messages) {
        setMessages(
          data.messages.map((msg) => ({
            role: msg.role,
            content: msg.content,
          }))
        );
      }
    } catch (error) {
      console.error("Failed to load conversation", error);
    }
  };


  //  Streaming Chat
  const handleStreamChat = async () => {
    if (!message.trim()) return;

    setStreaming(true);

    // 1. Add user message to UI immediately
    const userMessage = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    setMessage(""); // clear textarea

    try {
      const res = await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          conversationId,
        }),
      });


      // 2. Save conversationId
      const convId = res.headers.get("x-conversation-id");
      if (convId && !conversationId) {
        setConversationId(convId);
        localStorage.setItem("conversationId", convId);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // 3. Add empty assistant message (for streaming)
      let assistantMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, assistantMessage]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        // 4. Update LAST assistant message
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: updated[updated.length - 1].content + chunk,
          };
          return updated;
        });
      }
    } catch (error) {
      console.error(error);
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

        <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg max-w-[85%] whitespace-pre-wrap ${msg.role === "user"
                ? "ml-auto bg-indigo-600 text-white"
                : "mr-auto bg-[#0d1117] border border-[#1f6feb]/30 text-gray-100"
                }`}
            >
              {msg.content}
            </div>
          ))}
        </div>


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
        Built with ❤ OpenAI API & Next.js
      </footer>
    </div>
  );
}
