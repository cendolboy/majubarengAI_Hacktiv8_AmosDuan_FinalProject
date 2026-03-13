import { useState, useRef, useEffect } from "react";
import { sendMessageStream } from "./gemini"; 
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css"; 

function App() {
  const [messages, setMessages] = useState(() => {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef(null);

  // scroll otomatis ke bawah saat ada pesan baru
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // simpan chat history di localStorage
  useEffect(() => {
    localStorage.setItem("chatHistory", JSON.stringify(messages));
  }, [messages]);

  const handleSend = async () => {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) return;

    const userMessage = { role: "user", text: trimmedInput };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    // tambahkan pesan bot sementara
    const botMessage = { role: "bot", text: "" };
    setMessages((prev) => [...prev, botMessage]);

    try {
      // streaming response dari Gemini
      await sendMessageStream(trimmedInput, (chunk) => {
        setMessages((prev) =>
          prev.map((msg, i) =>
            i === prev.length - 1 ? { ...msg, text: prev[i].text + chunk } : msg
          )
        );
      });
    } catch (error) {
      console.error(error);
      setMessages((prev) =>
        prev.map((msg, i) =>
          i === prev.length - 1
            // Menampilkan pesan error spesifik dan membungkusnya dalam format kode markdown agar terlihat seperti log terminal merah
            ? { ...msg, text: `\`\`\`bash\n[ERROR LOG]\n${error.message}\n\`\`\`` }
            : msg
        )
      );
    }

    setLoading(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault(); // cegah newline
      handleSend();
    }
  };

  return (
    <div className="crypto-layout">
      <div className="mobile-wrapper">
        
        {/* Header ala Aplikasi Crypto */}
        <div className="crypto-header">
          <div className="header-info">
            <span className="status-dot"></span>
            <img 
              src="https://www.hacktiv8.com/_next/image?url=%2Flogo.png&w=3840&q=75" 
              alt="Hacktiv8 Logo" 
              className="header-logo" 
            />
          </div>
          <span className="badge-net">Peserta - Amos Duan</span>
        </div>

        {/* Chat Area */}
        <div className="chat-window">
          {messages.length === 0 && (
            <div className="empty-state">
              <p>System initialized.<br/>Awaiting commands...</p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat-wrapper ${msg.role === "user" ? "user-wrapper" : "bot-wrapper"}`}
            >
              <div className={`chat-bubble ${msg.role === "user" ? "user-bubble" : "bot-bubble"}`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-wrapper bot-wrapper">
              <div className="chat-bubble bot-bubble typing-indicator">
                <span>.</span><span>.</span><span>.</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div className="crypto-input-area">
          <div className="input-group crypto-input-group">
            <input
              className="form-control crypto-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Apa yang mau kamu tanyakan..."
              disabled={loading}
            />
            <button 
              className="btn crypto-send-btn" 
              onClick={handleSend} 
              disabled={loading || !input.trim()}
            >
              {loading ? "..." : "SEND"}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default App;