import React, { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck, Users, MoreVertical, ArrowLeft } from "lucide-react";
import img from "../assets/img";
import { chatApi } from "../../services/chatApi";

const mapApiMessage = (raw) => {
  const senderRole = String(raw?.senderRole || "").toLowerCase();
  return {
    id: raw?.id || raw?._id || Date.now(),
    sender: raw?.sender || (senderRole === "user" ? "client" : senderRole === "staff" ? "staff" : senderRole === "system" ? "system" : "admin"),
    senderId: raw?.senderId || "",
    message: raw?.message || "",
    timestamp: raw?.timestamp || raw?.createdAt || new Date().toISOString(),
    type: raw?.type || (raw?.imageUrl ? "image" : "text"),
    imageUrl: raw?.imageUrl || null,
    status: raw?.status || "sent",
    isEdited: Boolean(raw?.isEdited),
    isDeleted: Boolean(raw?.isDeleted),
    senderRole,
    senderName: raw?.senderName || "",
  };
};

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "U";
  return value.split(" ").slice(0, 2).map(p => p.charAt(0).toUpperCase()).join("");
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
  getInitials(getConversationDisplayName(conversation));

const CHAT_SIZE = "md:w-[720px] md:h-[600px]";
const CHAT_POSITION = "md:bottom-24 md:right-8";

const MessageActionMenu = ({ onEdit, onDeleteForEveryone, onDeleteForMe, onClose, isSystem, isDeleted, isOwn }) => {
  const ref = useRef(null);

  useEffect(() => {
    const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute right-8 bottom-0 z-50 w-max bg-white border border-stone-200 rounded-xl shadow-xl overflow-hidden py-1"
    >
      {!isSystem && !isDeleted && isOwn && (
        <button
          onClick={onEdit}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-stone-700 hover:bg-stone-50 transition-colors whitespace-nowrap"
          type="button"
        >
          Edit message
        </button>
      )}
      {!isSystem && !isDeleted && isOwn && (
        <button
          onClick={onDeleteForEveryone}
          className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
          type="button"
        >
          Delete for everyone
        </button>
      )}
      <button
        onClick={onDeleteForMe}
        className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-stone-600 hover:bg-stone-50 transition-colors whitespace-nowrap"
        type="button"
      >
        Delete for me
      </button>
    </div>
  );
};

const InlineEditInput = ({ initialValue, onSave, onCancel }) => {
  const [text, setText] = useState(initialValue);
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSave(text.trim()); }
    if (e.key === "Escape") onCancel();
  };

  return (
    <div className="flex flex-col gap-1">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full bg-white/20 text-white placeholder:text-blue-200 border border-blue-400 rounded-lg px-3 py-2 text-[13px] focus:outline-none resize-none"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-[11px] text-blue-200 hover:text-white px-2 py-0.5 rounded" type="button">Cancel</button>
        <button onClick={() => { if (text.trim()) onSave(text.trim()); }} className="text-[11px] bg-white text-blue-700 font-semibold px-2.5 py-0.5 rounded hover:bg-blue-50" type="button">Save</button>
      </div>
    </div>
  );
};

const ChatBubble = ({ id, sender, senderId, senderName, message, timestamp, type, imageUrl, status, isEdited, isDeleted, senderRole, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe }) => {
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isClient = sender === "client";
  const isSystem = senderRole === "system";
  const isOwn = isClient && String(senderId) === String(currentUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isSystem) {
    return (
      <div className="my-2 flex w-full justify-center">
        <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm italic text-center">
          {message}
        </span>
      </div>
    );
  }

  const handleSaveEdit = (newText) => {
    setEditing(false);
    onEdit(id, newText);
  };

  const bubbleClasses = isDeleted
    ? (isClient ? "bg-stone-100/90 text-stone-500 border border-stone-200 rounded-br-sm" : "bg-white text-stone-500 border border-stone-200 rounded-bl-sm")
    : (isClient ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-700 text-white border border-gray-800 rounded-bl-sm");

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} items-end mb-3 gap-1.5`}>
      {!isClient && (
        <div className="shrink-0 mb-[1px]">
          <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shadow-sm border border-blue-400 overflow-hidden text-white font-bold text-[8px] uppercase">
            {senderRole === "admin" ? (
              <img src={img.jjslogo1} alt="JJS" className="h-full w-full object-contain p-0.5" />
            ) : (
              getInitials(senderName || 'Staff')
            )}
          </div>
        </div>
      )}
      <div className="relative group max-w-[75%]">
        <div className={`absolute -top-1 ${isClient ? "-left-6" : "-right-6"} flex items-start opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="p-1 bg-white border border-stone-200 rounded-full shadow-sm hover:bg-stone-50 transition-colors"
            type="button"
          >
            <MoreVertical className="w-3 h-3 text-stone-500" />
          </button>
          {menuOpen && (
            <MessageActionMenu
              isSystem={isSystem}
              isDeleted={isDeleted}
              isOwn={isOwn}
              onEdit={() => { setMenuOpen(false); setEditing(true); }}
              onDeleteForEveryone={() => { setMenuOpen(false); onDeleteForEveryone(id); }}
              onDeleteForMe={() => { setMenuOpen(false); onDeleteForMe(id); }}
              onClose={() => setMenuOpen(false)}
            />
          )}
        </div>

        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${bubbleClasses}`}>
          {type === "image" && imageUrl && !isDeleted && (
            <div className="mb-2">
              <img src={imageUrl} alt="Attachment" className="max-h-44 rounded-xl border border-black/10 object-cover" />
            </div>
          )}

          {editing ? (
            <InlineEditInput initialValue={message} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
          ) : (
            message && <p className={`whitespace-pre-wrap ${isDeleted ? "italic opacity-80" : ""}`}>{message}</p>
          )}

          {!editing && (
            <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isClient && !isDeleted ? "text-blue-200" : "text-stone-400"}`}>
              {isEdited && !isDeleted && <span className="italic opacity-70 mr-1">edited</span>}
              {timeStr}
              {isClient && status === "read" && !isDeleted && <CheckCheck className="w-3 h-3" />}
              {isClient && status === "sent" && !isDeleted && <Check className="h-3 w-3" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ImagePreview = ({ imageFile, onRemove }) => {
  if (!imageFile) return null;
  return (
    <div className="border-t border-stone-100 bg-white px-4 pb-1 pt-3">
      <div className="relative inline-block">
        <img src={URL.createObjectURL(imageFile)} alt="Preview" className="h-16 w-16 rounded-lg border border-stone-200 object-cover shadow-sm" />
        <button onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-0.5 text-white shadow transition-colors hover:bg-red-500" type="button">
          <X className="h-2.5 w-2.5" />
        </button>
      </div>
    </div>
  );
};

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
    <form onSubmit={handleSend} className="shrink-0 border-t border-stone-100 bg-white">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />
      <div className="flex items-center gap-2 px-3 py-2.5">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-blue-600"
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
          className="flex-1 rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm text-stone-700 placeholder:text-stone-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/10 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !imageFile) || sending}
          className="shrink-0 rounded-full bg-blue-600 p-2 text-white shadow-md transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
};

const MessageList = ({ messages, isTyping, quickReplies, onSendQuickReply, isLoading, errorText, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe }) => {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages.length, isTyping]);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 p-4">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-[12px] text-stone-400">Loading messages…</div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-4">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-inner">
            <MessageCircle className="h-7 w-7 text-stone-200" />
          </div>
          <p className="text-[12px] text-stone-400 font-medium">No messages yet. Say hi!</p>
        </div>
      ) : (
        messages.map((msg) => (
          <ChatBubble
            key={msg.id}
            {...msg}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDeleteForEveryone={onDeleteForEveryone}
            onDeleteForMe={onDeleteForMe}
          />
        ))
      )}
      {isTyping && (
        <div className="flex w-full justify-start mb-3">
          <div className="rounded-2xl rounded-bl-sm border border-stone-200 bg-white px-4 py-3 shadow-sm flex gap-1">
            {["-0.3s", "-0.15s", "0s"].map((d, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-stone-400 animate-bounce" style={{ animationDelay: d }} />
            ))}
          </div>
        </div>
      )}
      {messages[messages.length - 1]?.senderRole === "admin" && quickReplies && (
        <div className="mt-2 mb-2 flex flex-wrap justify-end gap-2">
          {quickReplies.map((qr, i) => (
            <button
              key={i} onClick={() => onSendQuickReply(qr)}
              className="rounded-xl border border-stone-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-stone-600 shadow-sm transition-colors hover:bg-stone-50"
              type="button"
            >
              {qr}
            </button>
          ))}
        </div>
      )}
      {errorText && <div className="mt-2 text-center text-[11px] text-red-500 font-bold">{errorText}</div>}
      <div ref={endRef} />
    </div>
  );
};

const ConversationItem = ({ conversation, isSelected, onClick }) => (
  <div
    onClick={() => onClick(conversation)}
    className={`flex cursor-pointer border-b border-stone-100 transition-all items-center gap-3 px-4 py-3 ${isSelected ? "bg-blue-200" : "bg-stone-50 hover:bg-blue-100"
      }`}
  >
    <div className="relative shrink-0">
      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-sm uppercase bg-blue-600 text-sm">
        {getConversationDisplayName(conversation).toLowerCase() === "admin" ? (
          <img src={img.jjslogo1} alt="Admin" className="h-full w-full object-contain p-0.5" />
        ) : (
          getConversationInitial(conversation)
        )}
      </div>
      <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1">
        <h4 className={`truncate text-sm font-semibold ${conversation.unreadCount > 0 ? "text-blue-900" : "text-stone-800"}`}>
          {getConversationDisplayName(conversation)}
        </h4>
        <span className="shrink-0 text-[10px] text-stone-400">
          {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={`truncate text-[11px] ${conversation.unreadCount > 0 ? "font-semibold text-blue-600" : "text-stone-500"}`}>
          {conversation.lastMessagePreview || "No messages yet…"}
        </p>
        {conversation.unreadCount > 0 && (
          <span className="min-w-[16px] rounded-full bg-blue-600 px-1 py-0.5 text-center text-[9px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ConversationList = ({ adminConversations, tailorConversations, selectedConversation, onSelect, onClose }) => (
  <div className={`flex w-full sm:w-[280px] shrink-0 flex-col border-r border-stone-100 bg-white ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
    <div className="shrink-0 border-b border-stone-100 px-6 py-4 flex items-center justify-between bg-white border-r border-stone-100 overflow-hidden">
      {!selectedConversation && (
        <h3 className="text-2xl font-extrabold text-stone-800 tracking-tight">Chats</h3>
      )}
      {!selectedConversation && (
        <button onClick={onClose} className="md:hidden p-1.5 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors" type="button">
          <X className="w-5 h-5" />
        </button>
      )}
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
          <div className="flex items-center gap-2 bg-stone-50/50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-stone-500">
            <Users className="h-3.5 w-3.5" /> Tailors
          </div>
          {tailorConversations.map((conv) => (
            <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
          ))}
        </div>
      )}
      {adminConversations.length === 0 && tailorConversations.length === 0 && (
        <div className="p-6 text-center text-[12px] text-stone-400 font-medium">No conversations</div>
      )}
    </div>
  </div>
);

const ChatWindow = ({ onClose, isFullScreen, toggleFullScreen, messages, onSendMessage, isTyping, quickReplies, isLoading, errorText, adminConversations, tailorConversations, selectedConversation, onSelectConversation, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe }) => (
  <div
    className={`fixed z-[9999] flex overflow-hidden bg-white shadow-2xl transition-all duration-500 ${isFullScreen
      ? "inset-0 md:inset-4 md:rounded-2xl"
      : `inset-0 md:inset-auto ${CHAT_POSITION} ${CHAT_SIZE} md:rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.35)]`
      }`}
  >
    <ConversationList
      adminConversations={adminConversations}
      tailorConversations={tailorConversations}
      selectedConversation={selectedConversation}
      onSelect={onSelectConversation}
      onClose={onClose}
    />
    <div className={`flex-1 flex flex-col z-0 border-l border-stone-100 ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
      <div className="flex shrink-0 items-center justify-between bg-blue-600 px-4 py-3 text-white shadow-lg z-10">
        <div className="flex items-center gap-3">
          {selectedConversation && (
            <button
              onClick={() => onSelectConversation(null)}
              className="sm:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
              type="button"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}

          {selectedConversation ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm shadow-md overflow-hidden">
                {getConversationDisplayName(selectedConversation).toLowerCase() === "admin" ? (
                  <img src={img.jjslogo1} alt="JJS" className="h-full w-full object-contain" />
                ) : (
                  getConversationInitial(selectedConversation)
                )}
              </div>
              <div>
                <h3 className="font-bold text-base leading-tight drop-shadow-sm">{getConversationDisplayName(selectedConversation)}</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                  <span className="text-[10px] font-bold text-blue-100/90 tracking-widest uppercase">Active</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 animate-in fade-in duration-300">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                <img src={img.jjslogo1} alt="JJS" className="w-full h-full object-contain brightness-0 invert" />
              </div>
              <div>
                <h3 className="text-sm font-bold leading-tight tracking-wide drop-shadow-sm text-white">JJS Support</h3>
                <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-tighter">Support Inbox</p>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullScreen}
            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-all hidden sm:flex items-center justify-center"
            type="button"
            title={isFullScreen ? "Minimize" : "Maximize"}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onClose}
            className="p-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl transition-all shadow-inner group active:scale-95"
            type="button"
            title="Close Chat"
          >
            <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
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
        currentUserId={currentUserId}
        onEdit={onEdit}
        onDeleteForEveryone={onDeleteForEveryone}
        onDeleteForMe={onDeleteForMe}
      />
      <InputArea onSendMessage={onSendMessage} />
    </div>
  </div>
);

const ChatLauncher = ({ onClick, unreadCount }) => (
  <button
    onClick={onClick}
    aria-label="Toggle chat"
    className="fixed bottom-6 right-8 md:bottom-8 md:right-8 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-blue-600/10 transition-all hover:scale-110 hover:bg-blue-700 active:scale-95 group"
    type="button"
  >
    <MessageCircle className="h-7 w-7 group-hover:rotate-12 transition-transform" />
    {unreadCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-black text-white shadow-md animate-bounce">
        {unreadCount}
      </span>
    )}
  </button>
);

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");

  const QUICK_REPLIES = ["Track my order", "Pricing details", "Talk to an agent"];

  useEffect(() => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id || "");
      }
    } catch { /* ignore */ }
  }, []);

  const loadConversationSummary = useCallback(async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const response = await chatApi.getConversations();
      const rawConvs = Array.isArray(response?.conversations) ? response.conversations : [];
      setConversations(rawConvs);
      setUnreadCount(rawConvs.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0));
    } catch (error) {
      // Ignored
    }
  }, []);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !conversationId) return;
    try {
      if (!silent) setIsLoading(true);
      const response = await chatApi.getMessages({ conversationId });
      setMessages(Array.isArray(response?.messages) ? response.messages.map(mapApiMessage) : []);
      setErrorText("");
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to load chat messages");
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  const handleSendMessage = useCallback(async (msgObj) => {
    if (!selectedConversation) return;
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, sender: "client", senderId: currentUserId, message: msgObj.message || "", timestamp: new Date().toISOString(), type: msgObj.type, imageUrl: msgObj.imageUrl || null, status: "sent", isEdited: false, senderRole: "user" };
    setMessages((prev) => [...prev, optimistic]);
    setErrorText("");
    try {
      const response = await chatApi.sendMessage({ ...msgObj, conversationId: selectedConversation.id });
      const persisted = mapApiMessage(response?.chatMessage || {});
      setMessages((prev) => prev.map((m) => (m.id === tempId ? persisted : m)));
    } catch (error) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setErrorText(error?.response?.data?.message || "Failed to send message");
    }
  }, [selectedConversation, currentUserId]);

  const handleEdit = useCallback(async (messageId, newText) => {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, message: newText, isEdited: true } : m));
    try {
      await chatApi.editMessage({ messageId, message: newText });
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to edit message");
      if (selectedConversation) loadMessages(selectedConversation.id, true);
    }
  }, [selectedConversation, loadMessages]);

  const handleDeleteForEveryone = useCallback(async (messageId) => {
    try {
      const response = await chatApi.deleteMessageForEveryone({ messageId });
      const tombstone = mapApiMessage(response?.chatMessage || {});
      setMessages((prev) => prev.map((m) => (m.id === messageId ? tombstone : m)));
    } catch (error) {
      // Ignored
    }
  }, []);

  const handleDeleteForMe = useCallback(async (messageId) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    try {
      await chatApi.deleteMessageForMe({ messageId });
    } catch (error) {
      if (selectedConversation) loadMessages(selectedConversation.id, true);
    }
  }, [selectedConversation, loadMessages]);

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

  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setErrorText("");
  }, []);

  const adminConversations = conversations.filter((c) => !c.assignedStaffId);
  const tailorConversations = conversations.filter((c) => c.assignedStaffId);

  return (
    <>
      {!isOpen && (
        <ChatLauncher
          onClick={() => {
            setIsOpen(true);
            setSelectedConversation(null);
          }}
          unreadCount={unreadCount}
        />
      )}

      {isOpen && (
        <>
          <div
            className={`fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-sm transition-opacity ${isFullScreen || (typeof window !== 'undefined' && window.innerWidth < 768) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
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
            adminConversations={adminConversations}
            tailorConversations={tailorConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDeleteForEveryone={handleDeleteForEveryone}
            onDeleteForMe={handleDeleteForMe}
          />
        </>
      )}
    </>
  );
}
