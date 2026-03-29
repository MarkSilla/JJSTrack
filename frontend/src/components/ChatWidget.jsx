import React, { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck } from "lucide-react";
import img from "../assets/img";

const ChatBubble = ({ sender, message, timestamp, type, imageUrl, status }) => {
  const isClient = sender === "client";
  const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[75%] md:max-w-[65%] px-4 py-2.5 shadow-sm relative ${isClient
          ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
          : "bg-gray-700 text-white rounded-2xl rounded-bl-sm border border-gray-800"
          }`}
      >
        {type === "image" && imageUrl ? (
          <div className="mb-2">
            <img src={imageUrl} alt="Chat attachment" className="rounded-lg max-h-48 object-cover border border-white/20" />
          </div>
        ) : null}

        {message && <p className="text-sm leading-relaxed">{message}</p>}

        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isClient ? "text-blue-200" : "text-slate-300"}`}>
          {timeString}
          {isClient && status === "read" && <CheckCheck className="w-3 h-3 text-blue-200" />}
          {isClient && status === "sent" && <Check className="w-3 h-3 text-blue-200" />}
        </div>
      </div>
    </div>
  );
};
const ImagePreview = ({ imageFile, onRemove }) => {
  if (!imageFile) return null;
  const objectUrl = URL.createObjectURL(imageFile);

  return (
    <div className="px-4 pt-3 pb-1">
      <div className="relative inline-block">
        <img src={objectUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-stone-200 shadow-sm" />
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-stone-800 text-white rounded-full p-1 shadow hover:bg-red-500 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
//text
const InputArea = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleSend = (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;

    //Upload `imageFile` to your server/Supabase and use the public URL here instead of URL.createObjectURL
    let messageObj = {
      message: text.trim(),
      type: imageFile ? "image" : "text",
      imageUrl: imageFile ? URL.createObjectURL(imageFile) : null
    };

    onSendMessage(messageObj);
    setText("");
    setImageFile(null);
  };

  return (
    <form onSubmit={handleSend} className="bg-stone-50 border-t border-stone-200">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />

      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              setImageFile(e.target.files[0]);
            }
          }}
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
        />

        <button
          type="submit"
          disabled={!text.trim() && !imageFile}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </form>
  );
};

const MessageList = ({ messages, isTyping, quickReplies, onSendQuickReply }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  return (
    <div className="flex-1 bg-stone-50 flex flex-col items-center justify-center text-center p-8">
      <div className="w-20 h-20 bg-stone-200 text-stone-400 rounded-full flex items-center justify-center mb-5">
        <MessageCircle className="w-10 h-10" />
      </div>
      {messages.length === 0 ? (
        <div className="flex flex items-center justify-center text-stone-400 text-sm">
          No messages yet. Say hi!
        </div>
      ) : (
        messages.map((msg) => (
          <ChatBubble key={msg.id} {...msg} />
        ))
      )}

      {isTyping && (
        <div className="flex w-full justify-start mb-4">
          <div className="bg-gray-700 border border-gray-800 text-gray-100 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
          </div>
        </div>
      )}

      {messages[messages.length - 1]?.sender === "admin" && quickReplies && (
        <div className="flex flex-wrap gap-2 mt-2 mb-2 justify-end">
          {quickReplies.map((qr, idx) => (
            <button
              key={idx}
              onClick={() => onSendQuickReply(qr)}
              className="text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 transition-colors shadow-sm"
            >
              {qr}
            </button>
          ))}
        </div>
      )}

      <div ref={endOfMessagesRef} />
    </div>
  );
};

const ChatWindow = ({ onClose, isFullScreen, toggleFullScreen, messages, onSendMessage, isTyping, quickReplies }) => {
  return (
    <div
      className={`fixed z-[9999] flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isFullScreen
        ? "inset-0 md:inset-4 md:rounded-2xl"
        : "bottom-0 right-0 w-full h-[80vh] md:bottom-24 md:right-8 md:w-[380px] md:h-[600px] md:rounded-2xl rounded-t-2xl"
        }`}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={img.jjslogo1} alt="JJS" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = 'none'; }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">JJS-Admin</h3>
            <p className="text-[10px] text-blue-200 flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block shadow-sm"></span>
              {isTyping ? "Admin is typing..." : "Active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleFullScreen}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors hidden md:block"
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <MessageList
        messages={messages}
        isTyping={isTyping}
        quickReplies={quickReplies}
        onSendQuickReply={(text) => onSendMessage({ message: text, type: "text", imageUrl: null })}
      />
      <InputArea onSendMessage={onSendMessage} />
    </div>
  );
};

const ChatLauncher = ({ onClick, unreadCount }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-[9999] ring-4 ring-blue-600/20"
    >
      <MessageCircle className="w-7 h-7" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm border-2 border-white">
          {unreadCount}
        </span>
      )}
    </button>
  );
};

//widget
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  // Fetch initial chat history from the database here
  const [messages, setMessages] = useState([]);

  const QUICK_REPLIES = ["Track my order", "Pricing details", "Talk to an agent"];

  const handleSendMessage = (msgObj) => {
    // Optimistic UI update for client message
    const newMessage = {
      id: Date.now(),
      sender: "client",
      message: msgObj.message,
      timestamp: new Date().toISOString(),
      type: msgObj.type,
      //Replace local object URL with your backend-hosted URL string
      imageUrl: msgObj.imageUrl,
      status: "sent"
    };

    setMessages((prev) => [...prev, newMessage]);
    setIsTyping(true);


    // REMOVE THIS SIMULATION BLOCK BELOW
    // Replace this with your actual WebSocket / API listener for Admin replies
    setTimeout(() => {
      setMessages((prev) =>
        prev.map(m => m.id === newMessage.id ? { ...m, status: "read" } : m)
      );

      setTimeout(() => {
        setIsTyping(false);
        setMessages((prev) => [...prev, {
          id: Date.now() + 1,
          sender: "admin",
          message: "hello",
          timestamp: new Date().toISOString(),
          type: "text",
          status: "read"
        }]);
      }, 1000);
    }, 1500);
  };

  useEffect(() => {
    if (!isOpen) setIsFullScreen(false);
  }, [isOpen]);

  return (
    <>
      {!isOpen && <ChatLauncher onClick={() => setIsOpen(true)} unreadCount={0} />}

      {isOpen && (
        <>
          <div
            className={`fixed inset-0 bg-stone-900/40 z-[9998] transition-opacity ${isFullScreen || window.innerWidth < 768 ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setIsOpen(false)}
          />

          <ChatWindow
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            quickReplies={QUICK_REPLIES}
          />
        </>
      )}
    </>
  );
}
