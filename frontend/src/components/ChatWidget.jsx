import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck, Users, MoreVertical, ArrowLeft, Scissors, Shield, Search } from "lucide-react";
import { MdSearch } from 'react-icons/md';
import img from "../assets/img";
import { chatApi } from "../../services/chatApi";
import { useChatContext } from "../context/ChatContext";
import { requestWebNotificationPermission, showWebNotification } from "../utils/webNotification";

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
  if (!conversation) return "admin";
  return isTailorConversation(conversation) ? (conversation.assignedStaffName || "Tailor") : "Admin";
};

const getConversationInitial = (conversation) =>
  getInitials(getConversationDisplayName(conversation));

const CHAT_SIZE = "md:w-[960px] md:h-[550px]";
const CHAT_POSITION = "md:bottom-6 md:right-8";
const CHAT_SUMMARY_REFRESH_MS = 5000;

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

  return date.toLocaleDateString([], {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

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
        className="w-full bg-white/20 text-stone-800 placeholder:text-stone-400 border border-stone-200 rounded-lg px-3 py-2 text-[13px] focus:outline-none resize-none"
      />
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="text-[11px] text-stone-400 hover:text-stone-600 px-2 py-0.5 rounded" type="button">Cancel</button>
        <button onClick={() => { if (text.trim()) onSave(text.trim()); }} className="text-[11px] bg-blue-600 text-white font-semibold px-2.5 py-0.5 rounded hover:bg-blue-700" type="button">Save</button>
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

const ChatBubble = ({ id, sender, senderId, senderName, message, timestamp, type, imageUrl, status, isEdited, isDeleted, senderRole, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe, onImageClick }) => {
  const timeStr = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isClient = sender === "client";
  const isSystem = senderRole === "system";
  const isOwn = isClient && String(senderId) === String(currentUserId);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);

  if (isSystem) {
    return (
      <div className="my-4 flex w-full justify-center">
        <span className="rounded-full border border-stone-100 bg-stone-50 px-4 py-1.5 text-[11px] font-semibold text-stone-500 shadow-sm italic text-center">
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
    ? (isClient ? "bg-stone-50 text-stone-400 border border-stone-100 rounded-2xl rounded-br-none" : "bg-white text-stone-400 border border-stone-100 rounded-2xl rounded-bl-none")
    : (isClient ? "bg-blue-600 text-white rounded-2xl rounded-br-none shadow-sm" : "bg-white text-stone-800 border border-stone-100 shadow-sm rounded-2xl rounded-bl-none");

  return (
    <div className={`flex w-full ${isClient ? "justify-end" : "justify-start"} items-end mb-4 gap-2.5`}>
      {!isClient && (
        <div className="shrink-0 mb-1">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center shadow-sm border border-stone-200 overflow-hidden">
            {senderRole === "admin" ? (
              <img src={img.jjslogo1} alt="JJS" className="h-full w-full object-contain p-1" />
            ) : (
              <span className="text-blue-600 font-bold text-[10px] uppercase">{getInitials(senderName || 'Staff')}</span>
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

        <div className={`px-4 py-3 rounded-2xl text-[14px] leading-relaxed shadow-sm ${bubbleClasses}`}>
          {type === "image" && imageUrl && !isDeleted && (
            <div className="mb-2 cursor-zoom-in group/img relative" onClick={() => onImageClick(imageUrl)}>
              <img src={imageUrl} alt="Attachment" className="max-h-60 rounded-xl border border-black/10 object-cover transition-opacity group-hover:opacity-90" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-black/40 rounded-full p-2 text-white backdrop-blur-sm">
                  <Maximize2 className="w-5 h-5" />
                </div>
              </div>
            </div>
          )}

          {editing ? (
            <InlineEditInput initialValue={message} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
          ) : (
            message && <p className={`whitespace-pre-wrap ${isDeleted ? "italic opacity-80" : ""}`}>{message}</p>
          )}

          {!editing && (
            <div className={`mt-1.5 flex items-center justify-end gap-1 text-[10px] ${isClient && !isDeleted ? "text-blue-100" : "text-stone-400"}`}>
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
    <form onSubmit={handleSend} className="shrink-0 border-t border-stone-100 bg-white px-4 py-4">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-xl p-2.5 text-stone-400 transition-colors hover:bg-stone-50 hover:text-blue-600"
        >
          <Paperclip className="h-5 w-5" />
        </button>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
          onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }}
        />
        <input
          type="text" value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your message…"
          className="flex-1 rounded-2xl border border-stone-100 bg-stone-50 px-4 py-3 text-sm text-stone-700 placeholder:text-stone-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-500/5 transition-all font-sans"
        />
        <button
          type="submit"
          disabled={(!text.trim() && !imageFile) || sending}
          className="shrink-0 rounded-2xl bg-blue-600 p-3 text-white shadow-lg transition-all hover:bg-blue-700 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </form>
  );
};

const MessageList = ({ messages, isTyping, quickReplies, onSendQuickReply, isLoading, errorText, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe, onImageClick }) => {
  const endRef = useRef(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "auto" }); }, [messages.length, isTyping]);

  const messageHistory = messages.reduce((items, msg, index) => {
    const previousMessage = messages[index - 1];
    const currentDayKey = getMessageDayKey(msg.timestamp);
    const previousDayKey = previousMessage ? getMessageDayKey(previousMessage.timestamp) : null;

    if (currentDayKey !== previousDayKey) {
      items.push({
        type: "divider",
        key: `divider-${currentDayKey}-${index}`,
        label: getMessageDayLabel(msg.timestamp),
      });
    }

    items.push({
      type: "message",
      key: msg.id || `message-${index}`,
      message: msg,
    });

    return items;
  }, []);

  return (
    <div className="flex-1 overflow-y-auto bg-white p-6 custom-scrollbar">
      {isLoading ? (
        <div className="flex h-full items-center justify-center text-[13px] text-stone-400 font-medium">Loading messages…</div>
      ) : messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center text-center px-4">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-[32px] bg-stone-50">
            <Search className="h-10 w-10 text-blue-300" />
          </div>
          <h4 className="text-[16px] font-bold text-stone-800 mb-2">Start a conversation</h4>
          <p className="text-[13px] text-stone-400 font-medium max-w-[240px]">Send a message to our team to get started.</p>
        </div>
      ) : (
        messageHistory.map((item) => (
          item.type === "divider" ? (
            <div key={item.key} className="mb-5 flex justify-center">
              <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1 text-[11px] font-semibold text-blue-500 shadow-sm">
                {item.label}
              </span>
            </div>
          ) : (
            <ChatBubble
              key={item.key}
              {...item.message}
              currentUserId={currentUserId}
              onEdit={onEdit}
              onDeleteForEveryone={onDeleteForEveryone}
              onDeleteForMe={onDeleteForMe}
              onImageClick={onImageClick}
            />
          )
        ))
      )}
      {isTyping && (
        <div className="flex w-full justify-start mb-4">
          <div className="rounded-2xl rounded-bl-none border border-stone-100 bg-white px-4 py-3 shadow-sm flex gap-1">
            {["-0.3s", "-0.15s", "0s"].map((d, i) => (
              <span key={i} className="h-1.5 w-1.5 rounded-full bg-stone-300 animate-bounce" style={{ animationDelay: d }} />
            ))}
          </div>
        </div>
      )}
      {messages[messages.length - 1]?.senderRole === "admin" && quickReplies && (
        <div className="mt-4 mb-2 flex flex-wrap justify-end gap-2">
          {quickReplies.map((qr, i) => (
            <button
              key={i} onClick={() => onSendQuickReply(qr)}
              className="rounded-xl border border-stone-100 bg-white px-4 py-2 text-[12px] font-bold text-stone-600 shadow-sm transition-all hover:bg-stone-50 hover:border-blue-200 hover:text-blue-600"
              type="button"
            >
              {qr}
            </button>
          ))}
        </div>
      )}
      {errorText && <div className="mt-4 text-center text-[12px] text-red-500 font-bold bg-red-50 py-2 rounded-xl border border-red-100">{errorText}</div>}
      <div ref={endRef} />
    </div>
  );
};

const ConversationItem = ({ conversation, isSelected, onClick }) => (
  <div
    onClick={() => onClick(conversation)}
    className={`flex cursor-pointer transition-all items-center gap-3 px-6 py-4 ${isSelected ? "bg-blue-50/80" : "bg-white hover:bg-stone-50"
      }`}
  >
    <div className="relative shrink-0">
      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-sm uppercase bg-stone-100 text-sm border border-stone-200">
        {getConversationDisplayName(conversation).toLowerCase() === "admin" ? (
          <img src={img.jjslogo1} alt="Admin" className="h-full w-full object-contain p-1.5" />
        ) : (
          <span className="text-blue-600">{getConversationInitial(conversation)}</span>
        )}
      </div>
      <div className="absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white" />
    </div>
    <div className="min-w-0 flex-1">
      <div className="flex items-center justify-between gap-1 mb-0.5">
        <h4 className={`font-inter truncate text-[14px] font-bold ${conversation.unreadCount > 0 ? "text-stone-900" : "text-stone-800"}`}>
          {getConversationDisplayName(conversation)}
        </h4>
        <span className="shrink-0 text-[11px] text-stone-400 font-medium">
          {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
        </span>
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className={`truncate text-[13px] ${conversation.unreadCount > 0 ? "font-semibold text-stone-600" : "text-stone-500"}`}>
          {conversation.lastMessagePreview || "No messages yet…"}
        </p>
        {conversation.unreadCount > 0 && (
          <span className="min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-blue-600 px-1 text-center text-[10px] font-bold text-white">
            {conversation.unreadCount}
          </span>
        )}
      </div>
    </div>
  </div>
);

const ConversationList = ({ adminConversations, tailorConversations, layoutArtistConversations, selectedConversation, onSelect, onClose }) => {
  const [search, setSearch] = useState("");

  const filterConvs = (list) =>
    list.filter(c =>
      getConversationDisplayName(c).toLowerCase().includes(search.toLowerCase()) ||
      (c.lastMessagePreview || "").toLowerCase().includes(search.toLowerCase())
    );

  const filteredAdmins = filterConvs(adminConversations);
  const filteredTailors = filterConvs(tailorConversations);
  const filteredLayoutArtists = filterConvs(layoutArtistConversations);

  return (
    <div className={`flex w-full shrink-0 flex-col bg-white border-r border-stone-100 md:w-[320px] ${selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
      <div className="shrink-0 px-6 py-6 border-b border-gray-50">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[26px] font-black text-stone-900 font-inter tracking-tight">Messages</h3>
          <div className="flex items-center gap-3">
            <X onClick={onClose} className="w-6 h-6 text-stone-400 cursor-pointer hover:text-stone-600 transition-colors" />
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-stone-400 group-focus-within:text-blue-500 transition-colors" />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search messages..."
            className="block w-full pl-11 pr-4 py-3 bg-stone-50 border-none rounded-2xl text-[14px] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:bg-white focus:shadow-md transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
        {filteredAdmins.length > 0 && (
          <div className="py-2">
            <div className="px-6 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
              JJS Support
            </div>
            {filteredAdmins.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
            ))}
          </div>
        )}

        {filteredTailors.length > 0 && (
          <div className="py-2">
            <div className="px-6 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
              Tailors
            </div>
            {filteredTailors.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
            ))}
          </div>
        )}

        {filteredLayoutArtists.length > 0 && (
          <div className="py-2">
            <div className="px-6 py-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.1em] text-stone-400">
              Layout Artists
            </div>
            {filteredLayoutArtists.map((conv) => (
              <ConversationItem key={conv.id} conversation={conv} isSelected={selectedConversation?.id === conv.id} onClick={onSelect} />
            ))}
          </div>
        )}

        {filteredAdmins.length === 0 && filteredTailors.length === 0 && filteredLayoutArtists.length === 0 && (
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

const ActiveConversation = ({ conversation, messages, onSendMessage, isTyping, quickReplies, isLoading, errorText, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe, onBack, onImageClick }) => {
  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
      <div className="flex shrink-0 items-center justify-between border-b border-stone-50 px-6 py-4 bg-white z-10">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 -ml-2 text-stone-400 hover:text-stone-800 hover:bg-stone-50 rounded-full transition-all sm:hidden"
            type="button"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-stone-100 flex items-center justify-center font-bold text-sm shadow-sm overflow-hidden">
              {getConversationDisplayName(conversation).toLowerCase() === "admin" ? (
                <img src={img.jjslogo1} alt="JJS" className="h-full w-full object-contain p-1" />
              ) : (
                <span className="text-blue-600">{getConversationInitial(conversation)}</span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-[16px] text-stone-900 leading-tight">{getConversationDisplayName(conversation)}</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] font-bold font-inter text-emerald-500">Active now</span>
              </div>
            </div>
          </div>
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
        onImageClick={onImageClick}
      />
      <InputArea onSendMessage={onSendMessage} />
    </div>
  );
};

const ChatWindow = ({ onClose, isFullScreen, toggleFullScreen, messages, onSendMessage, isTyping, quickReplies, isLoading, errorText, adminConversations, tailorConversations, layoutArtistConversations, selectedConversation, onSelectConversation, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe, onImageClick }) => (
  <div
    className={`fixed z-[9999] flex overflow-hidden bg-white shadow-2xl transition-all duration-500 animate-modal-enter ${isFullScreen
      ? "inset-0 md:inset-4 md:rounded-[32px]"
      : `inset-0 md:inset-auto ${CHAT_POSITION} ${CHAT_SIZE} md:rounded-[32px] shadow-[0_30px_100px_rgba(0,0,0,0.25)]`
      }`}
  >
    <ConversationList
      adminConversations={adminConversations}
      tailorConversations={tailorConversations}
      layoutArtistConversations={layoutArtistConversations}
      selectedConversation={selectedConversation}
      onSelect={onSelectConversation}
      onClose={onClose}
    />
    <div className={`min-w-0 flex-1 flex-col z-0 bg-white ${!selectedConversation ? 'hidden sm:flex' : 'flex'}`}>
      {selectedConversation ? (
        <>
          <ActiveConversation
            conversation={selectedConversation}
            messages={messages}
            onSendMessage={onSendMessage}
            isLoading={isLoading}
            errorText={errorText}
            currentUserId={currentUserId}
            onEdit={onEdit}
            onDeleteForEveryone={onDeleteForEveryone}
            onDeleteForMe={onDeleteForMe}
            onBack={() => onSelectConversation(null)}
            onImageClick={onImageClick}
          />
        </>
      ) : (
        <div className="hidden sm:flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-slate-50/50 to-white p-8 text-center relative overflow-hidden select-none">
          <div className="absolute w-72 h-72 bg-blue-500/5 rounded-full blur-3xl -top-10 -right-10 pointer-events-none" />
          <div className="absolute w-60 h-60 bg-blue-600/5 rounded-full blur-2xl -bottom-10 -left-10 pointer-events-none" />
          <div className="relative z-10 w-20 h-20 bg-gradient-to-br from-blue-50 to-blue-100/60 rounded-3xl border border-blue-100 flex items-center justify-center mb-6 shadow-sm">
            <MessageCircle className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="relative z-10 text-lg sm:text-xl font-extrabold text-slate-900 mb-2 font-inter tracking-tight">
            Your Messages
          </h3>
          <p className="relative z-10 text-xs sm:text-sm font-medium text-slate-500 max-w-[320px] leading-relaxed mb-6">
            Select a conversation from the left sidebar to chat with support or your assigned tailor about your orders.
          </p>
        </div>
      )}
    </div>
  </div>
);

const ChatLauncher = ({ onClick, unreadCount }) => (
  <button
    onClick={onClick}
    aria-label="Toggle chat"
    className="fixed bottom-6 right-6 md:bottom-8 md:right-8 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl shadow-blue-600/30 ring-4 ring-blue-600/15 transition-all duration-200 ease-out hover:scale-105 hover:bg-blue-700 active:scale-95 group cursor-pointer"
    type="button"
  >
    <MessageCircle className="h-6 w-6 group-hover:rotate-12 transition-transform duration-200" />
    {unreadCount > 0 && (
      <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-black text-white shadow-md">
        {unreadCount}
      </span>
    )}
  </button>
);

export default function ChatWidget() {
  const location = useLocation();
  const { isOpen: contextIsOpen, openChat, closeChat } = useChatContext();
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [fullScreenImage, setFullScreenImage] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const conversationSummaryRef = useRef(new Map());
  const hasLoadedConversationSummaryRef = useRef(false);
  const selectedConversationRef = useRef(selectedConversation);

  const QUICK_REPLIES = ["Track my order", "Pricing details", "Talk to an agent"];

  useEffect(() => {
    selectedConversationRef.current = selectedConversation;
  }, [selectedConversation]);

  useEffect(() => {
    try {
      const token = localStorage.getItem("token") || sessionStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setCurrentUserId(payload.id || "");
      }
    } catch { /* ignore */ }
  }, []);

  const showChatNotification = useCallback((conversation) => {
    const conversationId = String(conversation?.id || conversation?._id || "");
    if (!conversationId) return;

    const selectedConversationId = String(selectedConversationRef.current?.id || "");
    if (
      contextIsOpen &&
      selectedConversationId === conversationId &&
      document.visibilityState === "visible"
    ) {
      return;
    }

    const senderName = getConversationDisplayName(conversation);
    const preview = String(conversation?.lastMessagePreview || "").trim();

    showWebNotification(
      {
        _id: `chat-${conversationId}-${conversation?.lastMessageAt || Date.now()}`,
        title: `New message from ${senderName}`,
        message: preview || "You have a new chat message.",
      },
      {
        tagPrefix: "jjstrack-user-chat",
        onClick: () => {
          openChat();
          setSelectedConversation(conversation);
        },
      }
    );
  }, [contextIsOpen, openChat]);

  const notifyNewUnreadConversations = useCallback((nextConversations = []) => {
    const previousMap = conversationSummaryRef.current;

    if (hasLoadedConversationSummaryRef.current) {
      nextConversations.forEach((conversation) => {
        const conversationId = String(conversation?.id || conversation?._id || "");
        if (!conversationId) return;

        const unreadCount = Number(conversation?.unreadCount || 0);
        if (unreadCount <= 0) return;

        const previousConversation = previousMap.get(conversationId);
        const previousUnreadCount = Number(previousConversation?.unreadCount || 0);

        if (unreadCount > previousUnreadCount) {
          showChatNotification(conversation);
        }
      });
    }

    conversationSummaryRef.current = new Map(
      nextConversations
        .map((conversation) => [String(conversation?.id || conversation?._id || ""), conversation])
        .filter(([conversationId]) => Boolean(conversationId))
    );
    hasLoadedConversationSummaryRef.current = true;
  }, [showChatNotification]);

  const loadConversationSummary = useCallback(async () => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token) return;
    try {
      const response = await chatApi.getConversations();
      const rawConvs = Array.isArray(response?.conversations) ? response.conversations : [];
      notifyNewUnreadConversations(rawConvs);
      setConversations(rawConvs);
      setUnreadCount(rawConvs.reduce((sum, c) => sum + Number(c.unreadCount || 0), 0));
    } catch (error) {
      // Ignored
    }
  }, [notifyNewUnreadConversations]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    if (!token || !conversationId) return;
    try {
      if (!silent) setIsLoadingMessages(true);
      const response = await chatApi.getMessages({ conversationId });
      setMessages(Array.isArray(response?.messages) ? response.messages.map(mapApiMessage) : []);
      setErrorText("");
    } catch (error) {
      setErrorText(error?.response?.data?.message || "Failed to load chat messages");
    } finally {
      if (!silent) setIsLoadingMessages(false);
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
    const id = setInterval(loadConversationSummary, CHAT_SUMMARY_REFRESH_MS);
    return () => clearInterval(id);
  }, [loadConversationSummary]);

  useEffect(() => {
    if (location.pathname !== "/home") return;

    const shouldOpenChat = sessionStorage.getItem("jjstrack-open-chat-on-dashboard");
    if (shouldOpenChat !== "1") return;

    sessionStorage.removeItem("jjstrack-open-chat-on-dashboard");
    void requestWebNotificationPermission();
    openChat();
  }, [location.pathname, openChat]);

  useEffect(() => {
    if (!contextIsOpen || !selectedConversation) return;
    loadMessages(selectedConversation.id, false);
    const id = setInterval(() => loadMessages(selectedConversation.id, true), 3000);
    return () => clearInterval(id);
  }, [contextIsOpen, selectedConversation, loadMessages]);

  const handleSelectConversation = useCallback((conversation) => {
    setSelectedConversation(conversation);
    setMessages([]);
    setErrorText("");
  }, []);

  const adminConversations = conversations.filter((c) => !c.assignedStaffId);

  // Deduplicate staff conversations to show only the most recent one per staff member
  const staffConversationsMap = conversations.filter((c) => c.assignedStaffId).reduce((acc, c) => {
    const staffId = c.assignedStaffId;
    if (!acc[staffId] || new Date(c.lastMessageAt) > new Date(acc[staffId].lastMessageAt)) {
      acc[staffId] = c;
    }
    return acc;
  }, {});

  const staffConversations = Object.values(staffConversationsMap);

  const tailorConversations = staffConversations.filter(c =>
    (c.assignedStaffRole || "").toLowerCase().includes("tailor") ||
    !(c.assignedStaffRole || "").toLowerCase().includes("layout")
  ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  const layoutArtistConversations = staffConversations.filter(c =>
    (c.assignedStaffRole || "").toLowerCase().includes("layout")
  ).sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

  const hidePaths = ["/order", "/invoices"];
  const shouldHide = hidePaths.some(path => location.pathname.startsWith(path));

  if (shouldHide) return null;

  return (
    <>
      {!contextIsOpen && (
        <ChatLauncher
          onClick={() => {
            void requestWebNotificationPermission();
            openChat();
            setSelectedConversation(null);
          }}
          unreadCount={unreadCount}
        />
      )}

      {contextIsOpen && (
        <>
          <div
            className={`fixed inset-0 z-[9998] bg-stone-900/60 backdrop-blur-sm transition-opacity ${isFullScreen || (typeof window !== 'undefined' && window.innerWidth < 768) ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            onClick={() => closeChat()}
            aria-hidden="true"
          />
          <ChatWindow
            onClose={() => closeChat()}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            messages={messages}
            onSendMessage={handleSendMessage}
            isTyping={isTyping}
            quickReplies={QUICK_REPLIES}
            isLoading={isLoadingMessages}
            errorText={errorText}
            adminConversations={adminConversations}
            tailorConversations={tailorConversations}
            layoutArtistConversations={layoutArtistConversations}
            selectedConversation={selectedConversation}
            onSelectConversation={handleSelectConversation}
            currentUserId={currentUserId}
            onEdit={handleEdit}
            onDeleteForEveryone={handleDeleteForEveryone}
            onDeleteForMe={handleDeleteForMe}
            onImageClick={(url) => setFullScreenImage(url)}
          />
          <ImageModal imageUrl={fullScreenImage} onClose={() => setFullScreenImage(null)} />
        </>
      )}
    </>
  );
}
