import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck,
  Search, ArrowLeft, MoreVertical
} from "lucide-react";
import img from "../assets/img";
import { chatApi } from "../services/chatApi";
import { staffApi } from "../services/staffApi";
import { requestWebNotificationPermission, showWebNotification } from "../utils/webNotification";

const CHAT_SUMMARY_REFRESH_MS = 5000;
const CHAT_SIZE = "md:w-[960px] md:h-[550px]";
const CHAT_POSITION = "md:bottom-6 md:right-8";

const getMessageDayKey = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "unknown";
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
};

const getMessageDayLabel = (timestamp) => {
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "Unknown date";

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(todayStart.getDate() - 1);
  const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (targetStart.getTime() === todayStart.getTime()) return "Today";
  if (targetStart.getTime() === yesterdayStart.getTime()) return "Yesterday";

  return date.toLocaleDateString([], { month: "long", day: "numeric", year: "numeric" });
};

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getInitials = (name) => {
  const value = String(name || "").trim();
  if (!value) return "U";
  return value
    .split(" ")
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
};

const mapConversation = (conversation) => {
  const fullName = conversation?.user?.fullName || "Unknown User";
  return {
    id: conversation?.id || conversation?._id,
    userId: conversation?.user?.id || conversation?.user?._id || "",
    scope: conversation?.scope || "support",
    name: fullName,
    avatar: getInitials(fullName),
    unreadCount: Number(conversation?.unreadCount || 0),
    status: "online",
    subjectLabel: conversation?.subjectLabel || "",
    subjectTitle: conversation?.subjectTitle || "",
    assignedStaffName: conversation?.assignedStaffName || "",
    assignedStaffRole: conversation?.assignedStaffRole || "",
    lastOrder: conversation?.subjectLabel || conversation?.subjectTitle || "",
    lastMessagePreview: conversation?.lastMessagePreview || "",
    lastMessageAt: conversation?.lastMessageAt || null,
  };
};

const mapStaffRosterItem = (staff, index = 0) => {
  const fullName = staff?.fullName || `${staff?.firstName || ""} ${staff?.lastName || ""}`.replace(/\s+/g, " ").trim() || "Staff";
  const employeeId = String(staff?.employeeId || `EMP-${String(index + 1).padStart(3, "0")}`).trim();
  return {
    id: `staff-${staff?._id || employeeId}`,
    userId: staff?._id || "",
    scope: "support",
    name: fullName,
    avatar: getInitials(fullName),
    unreadCount: 0,
    status: "online",
    subjectLabel: employeeId ? `# ${employeeId}` : "",
    subjectTitle: "",
    assignedStaffName: "",
    assignedStaffRole: staff?.position || "",
    lastOrder: "",
    lastMessagePreview: "No messages yet",
    lastMessageAt: null,
    conversationId: null,
  };
};

const mapMessage = (message) => {
  const senderRole = String(message?.senderRole || "").toLowerCase();
  return {
    id: message?.id || message?._id || Date.now(),
    sender: senderRole === "admin" ? "admin" : "client",
    senderId: message?.senderId || "",
    message: message?.message || "",
    timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
    type: message?.type || (message?.imageUrl ? "image" : "text"),
    imageUrl: message?.imageUrl || null,
    status: message?.status || "sent",
    isEdited: Boolean(message?.isEdited),
    isDeleted: Boolean(message?.isDeleted),
    senderRole,
    seenBy: message?.seenBy || [],
  };
};

const getChatNotificationId = (conversation) =>
  `chat-${conversation?.id || conversation?._id || "conversation"}-${conversation?.lastMessageAt || Date.now()}`;

const getChatNotificationMessage = (conversation) =>
  String(conversation?.lastMessagePreview || "").trim() || "You have a new chat message.";

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
    <div className="flex flex-col gap-1.5">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        rows={2}
        className="w-full bg-white/20 text-white placeholder:text-blue-200 border border-blue-400 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-[11px] text-blue-200 hover:text-white px-2 py-0.5 rounded" type="button">Cancel</button>
        <button onClick={() => { if (text.trim()) onSave(text.trim()); }} className="text-[11px] bg-white text-blue-700 font-semibold px-2.5 py-0.5 rounded hover:bg-blue-50" type="button">Save</button>
      </div>
    </div>
  );
};

const ImageModal = ({ imageUrl, onClose }) => {
  if (!imageUrl) return null;
  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-all hover:scale-110 active:scale-95"
        type="button"
      >
        <X className="w-8 h-8" />
      </button>
      <div className="relative max-w-[90vw] max-h-[90vh] overflow-hidden rounded-xl shadow-2xl animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <img
          src={imageUrl}
          alt="Full view"
          className="max-w-full max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

const AdminChatBubble = ({ id, sender, senderId, message, timestamp, type, imageUrl, status, isEdited, isDeleted, senderRole, currentUserId, clientAvatar, onEdit, onDeleteForEveryone, onDeleteForMe, onImageClick }) => {
  const tooltipTimeString = new Date(timestamp).toLocaleString([], {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const isAdmin = sender === "admin";
  const isOwn = isAdmin && String(senderId) === String(currentUserId);
  const isSystem = senderRole === "system";
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isSystem) {
    return (
      <div className="my-2 flex w-full justify-center">
        <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm italic">
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
    ? (isAdmin ? "bg-stone-50 text-stone-400 border border-stone-100 rounded-2xl rounded-br-none" : "bg-white text-stone-400 border border-stone-100 rounded-2xl rounded-bl-none")
    : (isAdmin ? "bg-blue-600 text-white rounded-2xl rounded-br-none shadow-sm" : "bg-white text-stone-800 border border-stone-100 shadow-sm rounded-2xl rounded-bl-none");

  return (
    <div className={`mb-4 flex w-full ${isAdmin ? "justify-end" : "justify-start"} items-end gap-2.5`}>
      {!isAdmin && (
        <div className="shrink-0 mb-1">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shadow-sm border border-stone-200 uppercase overflow-hidden">
            {clientAvatar}
          </div>
        </div>
      )}
      <div className="relative group max-w-[80%]">
        <div className={`pointer-events-none absolute -top-9 z-20 rounded-lg bg-stone-900 px-2.5 py-1 text-[10px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 ${isAdmin ? "right-0" : "left-0"}`}>
          {tooltipTimeString}
        </div>
        <div className={`absolute -top-1 ${isAdmin ? "-left-6" : "-right-6"} flex items-start opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
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

        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${bubbleClasses}`}>
          {type === "image" && imageUrl && !isDeleted ? (
            <div className="mb-2 cursor-zoom-in group/img relative" onClick={() => onImageClick(imageUrl)}>
              <img src={imageUrl} alt="Chat attachment" className="max-h-60 rounded-xl border border-black/10 object-cover transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 rounded-full p-2 text-white backdrop-blur-sm">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          ) : null}

          {editing ? (
            <InlineEditInput initialValue={message} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
          ) : (
            message && <p className={`whitespace-pre-wrap ${isDeleted ? "italic opacity-80" : ""}`}>{message}</p>
          )}

          {!editing && (
            <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isAdmin && !isDeleted ? "text-blue-100" : "text-stone-400"}`}>
              {isEdited && !isDeleted && <span className="italic opacity-70 mr-1">edited</span>}
              {isAdmin && status === "read" && !isDeleted && <CheckCheck className="h-3 w-3" />}
              {isAdmin && status === "sent" && !isDeleted && <Check className="h-3 w-3" />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientListItem = ({ client, isActive, onClick }) => {
  const metaLabel = client.scope === "order"
    ? [client.assignedStaffRole, client.assignedStaffName].filter(Boolean).join(" • ")
    : "Support conversation";

  return (
    <div
      onClick={onClick}
      className={`flex cursor-pointer transition-all items-center gap-3 px-6 py-4 ${isActive ? "bg-blue-50/80" : "bg-white hover:bg-stone-50"}`}
    >
      <div className="relative shrink-0">
        <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full font-bold text-blue-600 shadow-sm uppercase bg-stone-100 text-sm border border-stone-200">
          {client.avatar}
        </div>
        <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center justify-between gap-1">
          <h4 className={`truncate text-[15px] font-bold ${client.unreadCount > 0 ? "text-stone-900" : "text-stone-800"}`}>
            {client.name}
          </h4>
          {client.lastMessageAt && (
            <span className="shrink-0 text-[11px] text-stone-400 font-medium">
              {new Date(client.lastMessageAt).toLocaleDateString([], { month: "short", day: "numeric" })}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className={`truncate text-[13px] ${client.unreadCount > 0 ? "font-semibold text-stone-600" : "text-stone-500"}`}>
            {client.lastMessagePreview || "No messages"}
          </p>
          {client.unreadCount > 0 && (
            <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold text-white">
              {client.unreadCount}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

const ClientList = ({ sections, activeClientId, onSelect, searchQuery, setSearchQuery, scopeFilter, setScopeFilter, onClose, customerUnreadCount, staffUnreadCount }) => {
  return (
    <div className={`flex w-full shrink-0 flex-col bg-white border-r border-stone-100 md:w-[320px] ${activeClientId ? 'hidden md:flex' : 'flex'}`}>
      <div className="shrink-0 px-6 py-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-[25px] font-black text-stone-900 font-inter  tracking-tight">Messages</h1>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600 transition-colors" type="button">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="relative group mb-3">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            className="block w-full pl-11 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-[14px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:shadow-md transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          {["customer", "staff"].map((f) => {
            const count = f === "customer" ? customerUnreadCount : staffUnreadCount;
            return (
              <button
                key={f}
                onClick={() => setScopeFilter(f)}
                className={`flex-1 relative rounded-xl py-2 text-[11px] font-semibold capitalize transition-colors ${scopeFilter === f ? "bg-blue-600 text-white shadow-sm" : "bg-stone-100 text-stone-600 hover:bg-stone-200"}`}
                type="button"
              >
                {f}
                {count > 0 && (
                  <span className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white px-1 text-[9px] font-bold text-white shadow-sm ${scopeFilter === f ? "bg-red-500" : "bg-blue-600"}`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {sections.some((section) => section.items.length > 0) ? (
          sections.map((section) => (
            section.items.length > 0 ? (
              <div key={section.id} className="py-2">
                <div className="px-6 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
                  {section.label}
                </div>
                {section.items.map((client) => (
                  <ClientListItem
                    key={client.id}
                    client={client}
                    isActive={activeClientId === client.id}
                    onClick={() => onSelect(client.id)}
                  />
                ))}
              </div>
            ) : null
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <MessageCircle className="w-8 h-8 text-stone-200" />
            </div>
            <p className="text-sm font-medium text-stone-400">No conversations found</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ImagePreview = ({ imageFile, onRemove }) => {
  if (!imageFile) return null;
  const objectUrl = URL.createObjectURL(imageFile);
  return (
    <div className="border-t border-stone-200 bg-white px-4 pb-1 pt-3 animate-in slide-in-from-bottom-2 duration-300">
      <div className="relative inline-block mt-1">
        <img src={objectUrl} alt="Preview" className="h-20 w-20 rounded-lg border border-stone-200 object-cover shadow-sm" />
        <button
          onClick={onRemove}
          className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-1.5 text-white shadow-md transition-all hover:bg-red-500 hover:scale-110"
          type="button"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
};

const InputArea = ({ onSendMessage, disabled }) => {
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSend = async (event) => {
    if (event) event.preventDefault();
    if ((!text.trim() && !imageFile) || sending || disabled) return;

    try {
      setSending(true);
      const imageUrl = imageFile ? await fileToDataUrl(imageFile) : null;
      await onSendMessage({
        message: text.trim(),
        type: imageUrl ? "image" : "text",
        imageUrl,
      });
      setText("");
      setImageFile(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSend} className="shrink-0 border-t border-stone-200 bg-white">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />
      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2.5 text-stone-400 transition-all hover:bg-stone-100 hover:text-blue-600 active:scale-95"
          title="Attach image"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(event) => {
            if (event.target.files && event.target.files[0]) setImageFile(event.target.files[0]);
          }}
        />
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Reply as Admin..."
          disabled={disabled || sending}
          className="flex-1 rounded-full border border-stone-100 bg-stone-50 px-4 py-2.5 text-sm transition-all focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-400/10 placeholder:text-stone-400"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !imageFile) || sending || disabled}
          className="shrink-0 rounded-full bg-blue-600 p-2.5 text-white shadow-md transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:scale-100"
        >
          <Send className="ml-0.5 h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

const ActiveConversation = ({ client, messages, onSendMessage, isLoading, errorText, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe, isFullScreen, toggleFullScreen, onBack, onImageClick }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "auto" });
  }, [messages.length, client?.id]);

  const messageHistory = messages.reduce((items, message, index) => {
    const previousMessage = messages[index - 1];
    const currentDayKey = getMessageDayKey(message.timestamp);
    const previousDayKey = previousMessage ? getMessageDayKey(previousMessage.timestamp) : null;

    if (currentDayKey !== previousDayKey) {
      items.push({
        type: "divider",
        key: `divider-${currentDayKey}-${index}`,
        label: getMessageDayLabel(message.timestamp),
      });
    }

    items.push({
      type: "message",
      key: message.id || `message-${index}`,
      message,
    });

    return items;
  }, []);

  if (!client) {
    return (
      <div className="font-inter flex flex-1 flex-col items-center justify-center bg-stone-50 p-8 text-center animate-in fade-in duration-500">
        <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-stone-300 shadow-inner">
          <MessageCircle className="h-10 w-10 opacity-50" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-stone-800">No Chat Selected</h2>
        <p className="max-w-sm text-sm text-stone-500 leading-relaxed font-medium">Select a client from the inbox to start managing support requests.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-50 px-6 h-[88px] bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-full transition-all sm:hidden"
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-[52px] h-[52px] rounded-full bg-white flex items-center justify-center shadow-lg overflow-hidden border-2 border-stone-100">
              {typeof client.avatar === 'string' && client.avatar.length <= 2 ? (
                <span className="text-blue-600 font-bold text-lg">{client.avatar}</span>
              ) : (
                client.avatar
              )}
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-stone-900 leading-tight tracking-tight">{client.name}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-inter font-bold text-emerald-500">Active now</span>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={toggleFullScreen}
          className="p-2.5 text-stone-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all hidden sm:flex items-center justify-center"
          type="button"
          title={isFullScreen ? "Minimize" : "Maximize"}
        >
          {isFullScreen ? <Maximize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex flex-1 flex-col overflow-y-auto bg-white p-6 custom-scrollbar">
        {isLoading ? (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400 font-medium">
            <div className="flex flex-col items-center gap-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              Loading messages...
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-1 items-center justify-center text-sm text-stone-400 font-medium italic">No message history yet.</div>
        ) : (
          messageHistory.map((item) => (
            item.type === "divider" ? (
              <div key={item.key} className="mb-5 flex justify-center">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-[11px] font-semibold text-blue-500 shadow-sm">
                  {item.label}
                </span>
              </div>
            ) : (
              <AdminChatBubble
                key={item.key}
                {...item.message}
                currentUserId={currentUserId}
                clientAvatar={client.avatar}
                onEdit={onEdit}
                onDeleteForEveryone={onDeleteForEveryone}
                onDeleteForMe={onDeleteForMe}
                onImageClick={onImageClick}
              />
            )
          ))
        )}
        {errorText ? <div className="mt-4 mx-auto p-2 px-4 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100 shadow-sm">{errorText}</div> : null}
        <div ref={endOfMessagesRef} />
      </div>
      <InputArea onSendMessage={onSendMessage} disabled={!client} />
    </div>
  );
};

const AdminChatShell = ({ onClose, isFullScreen, toggleFullScreen, onUnreadChange }) => {
  const [clients, setClients] = useState([]);
  const [staffRoster, setStaffRoster] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("customer");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const clientSummaryRef = useRef(new Map());
  const hasLoadedClientSummaryRef = useRef(false);
  const activeClientIdRef = useRef(activeClientId);

  const activeClient = clients.find((client) => client.id === activeClientId) || null;
  const activeMessages = activeClientId ? (messagesByConversation[activeClientId] || []) : [];

  const totalUnread = useMemo(
    () => clients.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0),
    [clients]
  );

  const customerUnreadCount = useMemo(() => {
    return clients
      .filter((c) => !staffRoster.some((s) => String(s.userId || "") === String(c.userId || "")))
      .reduce((sum, c) => sum + Number(c.unreadCount || 0), 0);
  }, [clients, staffRoster]);

  const staffUnreadCount = useMemo(() => {
    return clients
      .filter((c) => staffRoster.some((s) => String(s.userId || "") === String(c.userId || "")))
      .reduce((sum, c) => sum + Number(c.unreadCount || 0), 0);
  }, [clients, staffRoster]);

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clients
      .filter((client) => {
        if (!q) return true;
        return (
          String(client.name || "").toLowerCase().includes(q) ||
          String(client.lastOrder || "").toLowerCase().includes(q) ||
          String(client.lastMessagePreview || "").toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return bTime - aTime;
      });
  }, [clients, searchQuery]);

  const conversationSections = useMemo(() => ([
    {
      id: "customers",
      label: "Customers",
      items: scopeFilter === "customer"
        ? filteredClients.filter((client) => !staffRoster.some((staff) => String(staff.userId || "") === String(client.userId || "")))
        : [],
    },
    {
      id: "staff",
      label: "Staff",
      items: scopeFilter === "staff"
        ? staffRoster.map((staff, index) => {
          const existingConversation = filteredClients.find((client) => String(client.userId || "") === String(staff.userId || ""));
          if (existingConversation) return existingConversation;
          return {
            ...staff,
            lastMessagePreview: "No messages yet",
            lastMessageAt: null,
            unreadCount: 0,
          };
        })
        : [],
    },
  ]), [filteredClients, scopeFilter, staffRoster]);

  useEffect(() => {
    activeClientIdRef.current = activeClientId;
  }, [activeClientId]);

  useEffect(() => {
    setActiveClientId(null);
  }, [scopeFilter]);

  const loadStaffRoster = useCallback(async () => {
    try {
      const response = await staffApi.getAllStaff();
      const rawStaff = Array.isArray(response?.staff)
        ? response.staff
        : Array.isArray(response?.data)
          ? response.data
          : [];

      setStaffRoster(rawStaff.map((staff, index) => mapStaffRosterItem(staff, index)));
    } catch {
      setStaffRoster([]);
    }
  }, []);

  const showAdminChatNotification = useCallback((client) => {
    const conversationId = String(client?.id || "");
    if (!conversationId) return;

    if (
      String(activeClientIdRef.current || "") === conversationId &&
      document.visibilityState === "visible"
    ) {
      return;
    }

    showWebNotification(
      {
        _id: getChatNotificationId(client),
        title: `New message from ${client?.name || "Customer"}`,
        message: getChatNotificationMessage(client),
      },
      {
        tagPrefix: "jjstrack-admin-chat",
        onClick: () => setActiveClientId(conversationId),
      }
    );
  }, []);

  const notifyNewUnreadClients = useCallback((nextClients = []) => {
    const previousMap = clientSummaryRef.current;

    if (hasLoadedClientSummaryRef.current) {
      nextClients.forEach((client) => {
        const conversationId = String(client?.id || "");
        if (!conversationId) return;

        const unreadCount = Number(client?.unreadCount || 0);
        if (unreadCount <= 0) return;

        const previousClient = previousMap.get(conversationId);
        const previousUnreadCount = Number(previousClient?.unreadCount || 0);

        if (unreadCount > previousUnreadCount) {
          showAdminChatNotification(client);
        }
      });
    }

    clientSummaryRef.current = new Map(
      nextClients
        .map((client) => [String(client?.id || ""), client])
        .filter(([conversationId]) => Boolean(conversationId))
    );
    hasLoadedClientSummaryRef.current = true;
  }, [showAdminChatNotification]);

  const loadConversations = useCallback(async (silent = false) => {
    if (!localStorage.getItem('adminToken')) return;
    try {
      if (!silent) setIsLoadingClients(true);
      const response = await chatApi.getConversations({ scope: "support" });
      const nextClients = Array.isArray(response?.conversations)
        ? response.conversations.map(mapConversation)
        : [];

      notifyNewUnreadClients(nextClients);
      setClients(nextClients);
      onUnreadChange?.(nextClients.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0));
      setErrorText("");
      if (activeClientId && !nextClients.some((client) => client.id === activeClientId)) {
        setActiveClientId(null);
      }
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to load inbox");
    } finally {
      if (!silent) setIsLoadingClients(false);
    }
  }, [activeClientId, notifyNewUnreadClients, onUnreadChange, scopeFilter]);

  const clearClientUnread = useCallback((conversationId) => {
    if (!conversationId) return;

    setClients((prev) => {
      let changed = false;
      const next = prev.map((client) => {
        if (String(client.id || "") !== String(conversationId) || Number(client.unreadCount || 0) <= 0) {
          return client;
        }

        changed = true;
        return { ...client, unreadCount: 0 };
      });

      if (changed) {
        onUnreadChange?.(next.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0));
      }

      return changed ? next : prev;
    });
  }, [onUnreadChange]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId || !localStorage.getItem('adminToken')) return;
    try {
      if (!silent) setIsLoadingMessages(true);
      const response = await chatApi.getMessages({ conversationId });
      const nextMessages = Array.isArray(response?.messages) ? response.messages.map(mapMessage) : [];
      setMessagesByConversation((prev) => ({ ...prev, [conversationId]: nextMessages }));
      clearClientUnread(conversationId);

      if (nextMessages.some(m => m.senderRole !== 'admin' && !m.seenBy?.includes(localStorage.getItem('adminId')))) {
        await chatApi.markConversationRead({ conversationId });
      }
      setErrorText("");
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to load history");
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, [clearClientUnread]);

  const handleSelectClient = useCallback(async (conversationId) => {
    const selectedClient = clients.find((client) => client.id === conversationId) ||
      staffRoster.find((staff) => staff.id === conversationId);
    if (!selectedClient) return;

    let nextConversationId = conversationId;

    if (!clients.some((client) => client.id === conversationId) && selectedClient.userId) {
      try {
        const response = await chatApi.openSupportConversation(selectedClient.userId);
        const openedConversation = mapConversation(response?.conversation || {});
        setClients((prev) => {
          const withoutSameUser = prev.filter((client) => String(client.userId || "") !== String(openedConversation.userId || ""));
          return [openedConversation, ...withoutSameUser];
        });
        nextConversationId = openedConversation.id;
      } catch (error) {
        setErrorText(error?.response?.data?.message || "Failed to open support chat");
        return;
      }
    }

    setActiveClientId(nextConversationId);
    clearClientUnread(nextConversationId);
    loadMessages(nextConversationId);
    try {
      await chatApi.markConversationRead({ conversationId: nextConversationId });
    } catch {
      // Ignore
    }
  }, [clearClientUnread, clients, loadMessages, staffRoster]);

  const handleSendMessage = useCallback(async (msgObj) => {
    if (!activeClientId) return;
    const adminId = localStorage.getItem('adminId') || "admin";
    const tempId = `temp-${Date.now()}`;
    const optimistic = { id: tempId, sender: "admin", senderId: adminId, message: msgObj.message || "", timestamp: new Date().toISOString(), type: msgObj.type || "text", imageUrl: msgObj.imageUrl || null, status: "sent", isEdited: false, senderRole: "admin" };
    setMessagesByConversation((prev) => ({ ...prev, [activeClientId]: [...(prev[activeClientId] || []), optimistic] }));

    try {
      const response = await chatApi.sendMessage({ conversationId: activeClientId, message: msgObj.message, type: msgObj.type, imageUrl: msgObj.imageUrl });
      const persisted = mapMessage(response?.chatMessage || {});
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeClientId]: (prev[activeClientId] || []).map((m) => (m.id === tempId ? persisted : m))
      }));
      await loadConversations(true);
    } catch (error) {
      setMessagesByConversation((prev) => ({ ...prev, [activeClientId]: (prev[activeClientId] || []).filter((m) => m.id !== tempId) }));
      setErrorText(error?.response?.data?.message || "Send failed");
    }
  }, [activeClientId, loadConversations]);

  const handleEdit = useCallback(async (messageId, newText) => {
    setMessagesByConversation((prev) => {
      const updated = {};
      for (const [cid, msgs] of Object.entries(prev)) {
        updated[cid] = msgs.map((m) => m.id === messageId ? { ...m, message: newText, isEdited: true } : m);
      }
      return updated;
    });
    try {
      await chatApi.editMessage({ messageId, message: newText });
    } catch (error) {
      if (activeClientId) loadMessages(activeClientId, true);
    }
  }, [activeClientId, loadMessages]);

  const handleDeleteForEveryone = useCallback(async (messageId) => {
    try {
      const response = await chatApi.deleteMessageForEveryone({ messageId });
      const tombstone = mapMessage(response?.chatMessage || {});
      setMessagesByConversation((prev) => {
        const updated = {};
        for (const [cid, msgs] of Object.entries(prev)) {
          updated[cid] = msgs.map((m) => m.id === messageId ? tombstone : m);
        }
        return updated;
      });
      await loadConversations(true);
    } catch (error) {
      // Ignored
    }
  }, [loadConversations]);

  const handleDeleteForMe = useCallback(async (messageId) => {
    setMessagesByConversation((prev) => {
      const updated = {};
      for (const [cid, msgs] of Object.entries(prev)) {
        updated[cid] = msgs.filter((m) => m.id !== messageId);
      }
      return updated;
    });
    try {
      await chatApi.deleteMessageForMe({ messageId });
    } catch (error) {
      if (activeClientId) loadMessages(activeClientId, true);
    }
  }, [activeClientId, loadMessages]);

  useEffect(() => {
    if (!localStorage.getItem('adminToken')) return;
    loadConversations();
    loadStaffRoster();
    const inv = setInterval(() => loadConversations(true), CHAT_SUMMARY_REFRESH_MS);
    return () => clearInterval(inv);
  }, [loadConversations, loadStaffRoster]);

  useEffect(() => {
    if (!activeClientId) return;
    if (messagesByConversation[activeClientId]) return;
    loadMessages(activeClientId);
  }, [activeClientId, loadMessages, messagesByConversation]);

  useEffect(() => {
    if (!activeClientId) return;
    const inv = setInterval(() => loadMessages(activeClientId, true), 3000);
    return () => clearInterval(inv);
  }, [activeClientId, loadMessages]);

  return (
    <div
      className={`fixed z-[9999] flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen
        ? "inset-0 md:inset-4 md:rounded-[32px]"
        : `inset-0 md:inset-auto ${CHAT_POSITION} ${CHAT_SIZE} md:rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.25)]`
        }`}
    >

      <div className="relative flex flex-1 overflow-hidden w-full">
        <ClientList
          sections={conversationSections}
          activeClientId={activeClientId}
          onSelect={handleSelectClient}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          scopeFilter={scopeFilter}
          setScopeFilter={setScopeFilter}
          onClose={onClose}
          customerUnreadCount={customerUnreadCount}
          staffUnreadCount={staffUnreadCount}
        />
        <div className={`flex flex-1 flex-col z-0 border-l border-stone-100 ${!activeClientId ? 'hidden md:flex' : 'flex'}`}>
          <ActiveConversation
            client={activeClient}
            messages={activeMessages}
            onSendMessage={handleSendMessage}
            isLoading={isLoadingMessages}
            errorText={errorText}
            currentUserId={localStorage.getItem('adminId') || "admin"}
            onEdit={handleEdit}
            onDeleteForEveryone={handleDeleteForEveryone}
            onDeleteForMe={handleDeleteForMe}
            isFullScreen={isFullScreen}
            toggleFullScreen={toggleFullScreen}
            onBack={() => setActiveClientId(null)}
            onImageClick={(url) => setFullScreenImage(url)}
          />
          <ImageModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
        </div>
      </div>
    </div>
  );
};

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);
  const closedClientSummaryRef = useRef(new Map());
  const hasLoadedClosedClientSummaryRef = useRef(false);
  const isOpenRef = useRef(isOpen);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    setIsFullScreen(false);
  }, []);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  const notifyClosedUnreadClients = useCallback((nextClients = []) => {
    const previousMap = closedClientSummaryRef.current;

    if (!isOpenRef.current && hasLoadedClosedClientSummaryRef.current) {
      nextClients.forEach((client) => {
        const conversationId = String(client?.id || "");
        if (!conversationId) return;

        const unreadCount = Number(client?.unreadCount || 0);
        if (unreadCount <= 0) return;

        const previousClient = previousMap.get(conversationId);
        const previousUnreadCount = Number(previousClient?.unreadCount || 0);

        if (unreadCount > previousUnreadCount) {
          showWebNotification(
            {
              _id: getChatNotificationId(client),
              title: `New message from ${client?.name || "Customer"}`,
              message: getChatNotificationMessage(client),
            },
            {
              tagPrefix: "jjstrack-admin-chat",
              onClick: () => setIsOpen(true),
            }
          );
        }
      });
    }

    closedClientSummaryRef.current = new Map(
      nextClients
        .map((client) => [String(client?.id || ""), client])
        .filter(([conversationId]) => Boolean(conversationId))
    );
    hasLoadedClosedClientSummaryRef.current = true;
  }, []);

  const loadChatSummary = useCallback(async () => {
    if (!localStorage.getItem('adminToken')) {
      setTotalUnread(0);
      closedClientSummaryRef.current = new Map();
      hasLoadedClosedClientSummaryRef.current = false;
      return;
    }

    try {
      const response = await chatApi.getConversations({ scope: "support" });
      const nextClients = Array.isArray(response?.conversations)
        ? response.conversations.map(mapConversation)
        : [];
      notifyClosedUnreadClients(nextClients);
      setTotalUnread(nextClients.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0));
    } catch {
      // Keep the last unread count if the lightweight poll misses once.
    }
  }, [notifyClosedUnreadClients]);

  useEffect(() => {
    const handleCloseEvent = () => setIsOpen(false);
    window.addEventListener('close-admin-chat', handleCloseEvent);
    return () => window.removeEventListener('close-admin-chat', handleCloseEvent);
  }, []);

  useEffect(() => {
    loadChatSummary();
    const intervalId = setInterval(loadChatSummary, CHAT_SUMMARY_REFRESH_MS);
    return () => clearInterval(intervalId);
  }, [loadChatSummary]);

  return (
    <React.Fragment>
      {!isOpen && (
        <button
          id="admin-chat-bubble"
          onClick={() => {
            void requestWebNotificationPermission();
            setIsOpen(true);
          }}
          className="fixed bottom-6 right-8 md:bottom-6 md:right-8 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-blue-600/10 transition-all hover:scale-110 hover:bg-blue-700 active:scale-95 group"
        >
          <MessageCircle className="h-7 w-7 group-hover:rotate-12 transition-transform" />
          {totalUnread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 text-[10px] font-black text-white shadow-md animate-bounce">
              {totalUnread}
            </span>
          )}
        </button>
      )}
      {isOpen && (
        <React.Fragment>
          <div
            className={`fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-sm transition-opacity ${isFullScreen || (typeof window !== 'undefined' && window.innerWidth < 768) ? 'opacity-100' : 'pointer-events-none opacity-0'
              }`}
            onClick={handleClose}
          />
          <AdminChatShell
            onClose={handleClose}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            onUnreadChange={setTotalUnread}
          />
        </React.Fragment>
      )}
    </React.Fragment>
  );
}
