import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck, User, Users } from "lucide-react";
import img from "../assets/img";
import { chatApi } from "../../services/chatApi";

const mapApiMessage = (raw) => {
  const senderRole = String(raw?.senderRole || "").toLowerCase();
  return {
    id: raw?.id || raw?._id || Date.now(),
    sender: raw?.sender || (senderRole === "user" ? "client" : senderRole === "staff" ? "staff" : "admin"),
    message: raw?.message || "",
    timestamp: raw?.timestamp || raw?.createdAt || new Date().toISOString(),
    type: raw?.type || (raw?.imageUrl ? "image" : "text"),
    imageUrl: raw?.imageUrl || null,
    status: raw?.status || "sent",
  };
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const isTailorConversation = (conversation) => Boolean(conversation?.assignedStaffId);

const getConversationDisplayName = (conversation) => {
  if (!conversation) return "Admin";
  return isTailorConversation(conversation) ? (conversation.assignedStaffName || "Tailor") : "Admin";
};

const getConversationInitial = (conversation) =>
  getConversationDisplayName(conversation).charAt(0).toUpperCase();

const getIncomingSenderLabel = (sender) => {
  if (sender === "staff") return "Tailor";
  if (sender === "admin") return "Admin";
  return "";
};

/* ─── Standard sizing token ─────────────────────────────────── */
const CHAT_SIZE = "md:w-[680px] md:h-[530px]";
const CHAT_POSITION = "bottom-[100px] right-2 md:bottom-[100px] md:right-8";

/* ─── Chat Bubble ───────────────────────────────────────────── */
const ChatBubble = ({ sender, message, timestamp, type, imageUrl, status }) => {
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isClient = sender === "client";
  const senderLabel = isClient ? "" : getIncomingSenderLabel(sender);

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} mb-3`}>
      <div
        className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${isClient
          ? "bg-blue-600 text-white rounded-br-sm"
          : "bg-white text-slate-800 border border-slate-200 rounded-bl-sm"
          }`}
      >
        {!isClient && senderLabel && (
          <p className="mb-1 text-[10px] font-semibold text-blue-500 uppercase tracking-wide">{senderLabel}</p>
        )}
        {type === "image" && imageUrl && (
          <div className="mb-2">
            <img src={imageUrl} alt="Attachment" className="max-h-44 rounded-xl border border-black/10 object-cover" />
          </div>
        )}
        {message && <p className="whitespace-pre-wrap">{message}</p>}
        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isClient ? "text-blue-200" : "text-slate-400"}`}>
          {timeStr}
          {isClient && status === "read" && <CheckCheck className="w-3 h-3" />}
          {isClient && status === "sent" && <Check className="w-3 h-3" />}
        </div>
      </div>
    </div>
  );
};

/* ─── Image Preview ─────────────────────────────────────────── */
const ImagePreview = ({ imageFile, onRemove }) => {
  if (!imageFile) return null;
  return (
    <div className="border-t border-slate-100 bg-white px-4 pb-1 pt-3">
      <div className="relative inline-block">
        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 rounded-lg border border-slate-200 object-cover shadow-sm" />
        <button onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-slate-700 p-0.5 text-white shadow transition-colors hover:bg-red-500" type="button">
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
};

/* ─── Input Area ────────────────────────────────────────────── */
const InputArea = ({ onSendMessage }) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || sending) return;
    try {
      setSending(true);
      const imageUrl = imageFile ? await fileToDataUrl(imageFile) : null;
      await onSendMessage({ message: text.trim(), type: imageUrl ? "image" : "text", imageUrl });
      setText("");
      setImageFile(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="shrink-0 border-t border-slate-100 bg-white">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <Paperclip className="h-4 w-4" />
        </button>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
          onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
        />
        <input
          type="text" value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-[13px] text-slate-700 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !imageFile) || sending}
          className="shrink-0 rounded-xl bg-blue-600 p-2 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

/* ─── Message List ──────────────────────────────────────────── */
const MessageList = ({ messages, isTyping, quickReplies, onSendQuickReply, isLoading, errorText }) => {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50 p-4">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-[12px] text-slate-400">Loading messages…</div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50">
            <MessageCircle className="h-7 w-7 text-blue-300" />
          </div>
          <p className="text-[12px] text-slate-400">No messages yet. Say hi!</p>
        </div>
      ) : (
        messages.map((msg) => <ChatBubble key={msg.id} {...msg} />)
      )}
      {isTyping && (
        <div className="flex w-full justify-start mb-3">
          <div className="rounded-2xl rounded-bl-sm border border-slate-200 bg-white px-4 py-3 shadow-sm flex gap-1">
            {["-0.3s", "-0.15s", "0s"].map((d, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: d }} />
            ))}
          </div>
        </div>
      )}
      {messages[messages.length - 1]?.sender === "admin" && quickReplies && (
        <div className="mt-2 mb-2 flex flex-wrap justify-end gap-2">
          {quickReplies.map((qr, i) => (
            <button
              key={i} onClick={() => onSendQuickReply(qr)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
              type="button"
            >
              {qr}
            </button>
          ))}
        </div>
      )}
      {errorText && <div className="mt-2 text-center text-[11px] text-red-500">{errorText}</div>}
      <div ref={endRef} />
    </div>
  );
};

/* ─── Conversation List Item ────────────────────────────────── */
const ConversationItem = ({ conversation, isSelected, onClick }) => (
  <div
    onClick={() => onClick(conversation)}
    className={`flex cursor-pointer items-start gap-3 border-b border-slate-100 px-4 py-3 transition-all hover:bg-slate-50 ${isSelected ? "border-l-2 border-blue-500 bg-blue-50" : "border-l-2 border-transparent"
      }`}
  >
    <div className="relative shrink-0">
      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-bold text-slate-600 shadow-sm">
        {isTailorConversation(conversation) ? (
          getConversationInitial(conversation)
        ) : (
          <img src={img.jjslogo1} alt="Admin" className="h-full w-full object-contain" />
        )}
      </div>
      <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white bg-green-500" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-start justify-between gap-1">
        <h4 className={`truncate text-[12px] font-semibold ${conversation.unreadCount > 0 ? "text-slate-900" : "text-slate-700"}`}>
          {getConversationDisplayName(conversation)}
        </h4>
        <span className="mt-0.5 shrink-0 text-[10px] text-slate-400">
          {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={`truncate text-[11px] ${conversation.unreadCount > 0 ? "font-semibold text-blue-600" : "text-slate-500"}`}>
          {conversation.lastMessagePreview || "No messages yet…"}
        </p>
        {conversation.unreadCount > 0 && (
          <span className="min-w-[18px] rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[9px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </div>
  </div>
);

/* ─── Conversation List Panel ───────────────────────────────── */
const ConversationList = ({ adminConversations, tailorConversations, selectedConversation, onSelect }) => (
  <div className={`flex w-full md:w-[230px] shrink-0 flex-col border-r border-slate-100 bg-white ${selectedConversation ? 'hidden md:flex' : 'flex'}`}>
    <div className="shrink-0 border-b border-slate-100 px-4 py-4">
      <h3 className="text-[18px] font-bold text-slate-700">Chats</h3>
    </div>
    <div className="flex-1 overflow-y-auto">
      {adminConversations.length > 0 && (
        <div>
          {adminConversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
          ))}
        </div>
      )}
      {tailorConversations.length > 0 && (
        <div>
          <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
            <Users className="h-3.5 w-3.5" /> Tailors
          </div>
          {tailorConversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
          ))}
        </div>
      )}
      {adminConversations.length === 0 && tailorConversations.length === 0 && (
        <div className="p-6 text-center text-[12px] text-slate-400">No conversations</div>
      )}
    </div>
  </div>
);

/* ─── Chat Window ───────────────────────────────────────────── */
const ChatWindow = ({ onClose, isFullScreen, toggleFullScreen, messages, onSendMessage, isTyping, quickReplies, isLoading, errorText, adminConversations, tailorConversations, selectedConversation, onSelectConversation }) => (
  <div
    className={`fixed z-[9999] flex overflow-hidden bg-white shadow-2xl transition-all duration-300 ${isFullScreen
      ? "inset-0 md:inset-4 md:rounded-2xl"
      : `${CHAT_POSITION} w-[calc(100%-16px)] sm:w-[400px] h-[calc(100svh-120px)] rounded-2xl ${CHAT_SIZE}`
      }`}
  >
    <ConversationList
      adminConversations={adminConversations}
      tailorConversations={tailorConversations}
      selectedConversation={selectedConversation}
      onSelect={onSelectConversation}
    />
    <div className={`flex flex-1 flex-col z-0 border-l border-slate-100 ${!selectedConversation ? 'hidden md:flex' : 'flex'}`}>
      <div className="flex shrink-0 items-center justify-between border-b border-blue-700 bg-blue-600 px-4 py-3 text-white shadow-sm z-10">
        <div className="flex items-center gap-3">
          {/* Mobile Back Button */}
          <button onClick={() => onSelectConversation(null)} className="mr-[-4px] rounded-md p-1 pl-0 text-blue-200 transition-colors hover:text-white md:hidden" type="button">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </button>
          <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-white shadow-sm">
            <img src={img.jjslogo1} alt="JJS" className="h-full w-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
          </div>
          <div>
            <h3 className="text-[14px] font-bold leading-tight">
              {getConversationDisplayName(selectedConversation)}
            </h3>
            <p className="flex items-center gap-1.5 text-[10px] font-medium text-blue-200 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 inline-block shadow-sm" />
              {isTyping ? "Typing…" : "Active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={toggleFullScreen} className="hidden rounded-md p-1.5 text-blue-200 transition-colors hover:bg-blue-700 hover:text-white md:block" type="button">
            {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
          <button onClick={onClose} className="rounded-md bg-blue-700 p-1.5 text-blue-200 shadow-sm transition-colors hover:bg-blue-800 hover:text-white" type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <MessageList
        messages={messages}
        isTyping={isTyping}
        quickReplies={quickReplies}
        onSendQuickReply={(text) => onSendMessage({ message: text, type: "text", imageUrl: null })}
        isLoading={isLoading}
        errorText={errorText}
      />
      <InputArea onSendMessage={onSendMessage} />
    </div>
  </div>
);

/* ─── Launcher ──────────────────────────────────────────────── */
const ChatLauncher = ({ onClick, unreadCount }) => (
  <button
    onClick={onClick}
    aria-label="Toggle chat"
    className="fixed bottom-6 right-4 md:bottom-8 md:right-8 z-[10000] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-blue-600/20 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
    type="button"
  >
    <MessageCircle className="h-7 w-7" />
    {unreadCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-bold text-white shadow-sm">
        {unreadCount}
      </span>
    )}
  </button>
);

/* ─── Widget Entry Point ────────────────────────────────────── */
export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);

  const QUICK_REPLIES = ["Track my order", "Pricing details", "Talk to an agent"];

  const loadConversationSummary = useCallback(async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const response = await chatApi.getConversations();
      const convs = Array.isArray(response?.conversations) ? response.conversations : [];
      setConversations(convs);
      if (convs.length > 0 && !selectedConversation) setSelectedConversation(convs[0]);
      setUnreadCount(convs.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0));
    } catch (error) {
      console.error("Load conversation summary error:", error);
    }
  }, [selectedConversation]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !conversationId) return;
    try {
      if (!silent) setIsLoading(true);
      const response = await chatApi.getMessages({ conversationId });
      setMessages(Array.isArray(response?.messages) ? response.messages.map(mapApiMessage) : []);
      setErrorText("");
    } catch (error) {
      console.error("Load messages error:", error);
      setErrorText(error?.response?.data?.message || "Failed to load chat messages");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (msgObj) => {
    if (!selectedConversation) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, sender: "client", message: msgObj.message || "", timestamp: new Date().toISOString(), type: msgObj.type, imageUrl: msgObj.imageUrl || null, status: "sent" };
    setMessages((prev) => [...prev, optimistic]);
    setErrorText("");
    try {
      const response = await chatApi.sendMessage({ ...msgObj, conversationId: selectedConversation.id });
      const persisted = mapApiMessage(response?.chatMessage || {});
      setMessages((prev) => prev.map((m) => (m.id === tempId ? persisted : m)));
    } catch (error) {
      console.error("Send message error:", error);
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorText(error?.response?.data?.message || "Failed to send message");
    }
  }, [selectedConversation]);

  useEffect(() => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    loadConversationSummary();
    const id = setInterval(loadConversationSummary, 5000);
    return () => clearInterval(id);
  }, [loadConversationSummary]);

  useEffect(() => {
    if (!isOpen || !selectedConversation) return;
    loadMessages(selectedConversation.id, false);
    const id = setInterval(() => loadMessages(selectedConversation.id, true), 3000);
    return () => clearInterval(id);
  }, [isOpen, selectedConversation, loadMessages]);

  useEffect(() => { if (!isOpen) setIsFullScreen(false); }, [isOpen]);

  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setErrorText("");
  }, []);

  const adminConversations = conversations.filter((c) => !c.assignedStaffId);
  const tailorConversations = conversations.filter((c) => c.assignedStaffId);
  const isSmallScreen = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      <ChatLauncher onClick={() => setIsOpen(!isOpen)} unreadCount={unreadCount} />

      {isOpen && (
        <>
          <div
            className={`fixed inset-0 z-[9998] bg-slate-900/30 transition-opacity ${isFullScreen || isSmallScreen ? "opacity-100" : "opacity-0 pointer-events-none"}`}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <ChatWindow
            onClose={() => setIsOpen(false)}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            quickReplies={QUICK_REPLIES}
            isLoading={isLoading}
            errorText={errorText}
            conversations={conversations}
            adminConversations={adminConversations}
            tailorConversations={tailorConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
          />
        </>
      )}
    </>
  );
}
