import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck,
  Search, ArrowLeft, ShieldAlert, Circle
} from "lucide-react";
import img from "../assets/img";
import { chatApi } from "../services/chatApi";

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
    name: fullName,
    avatar: getInitials(fullName),
    unreadCount: Number(conversation?.unreadCount || 0),
    status: "online",
    lastOrder: conversation?.user?.email || "",
    lastMessagePreview: conversation?.lastMessagePreview || "",
    lastMessageAt: conversation?.lastMessageAt || null,
  };
};

const mapMessage = (message) => {
  const senderRole = String(message?.senderRole || "").toLowerCase();
  return {
    id: message?.id || message?._id || Date.now(),
    sender: senderRole === "user" ? "client" : "admin",
    message: message?.message || "",
    timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
    type: message?.type || (message?.imageUrl ? "image" : "text"),
    imageUrl: message?.imageUrl || null,
    status: message?.status || "sent",
  };
};

const AdminChatBubble = ({ sender, message, timestamp, type, imageUrl, status }) => {
  const timeString = new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const isAdmin = sender === "admin";

  return (
    <div className={`flex w-full ${isAdmin ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 shadow-sm relative ${isAdmin
          ? "bg-blue-600 text-white rounded-2xl rounded-br-sm"
          : "bg-gray-700 text-white rounded-2xl rounded-bl-sm border border-gray-800"
          }`}
      >
        {type === "image" && imageUrl ? (
          <div className="mb-2">
            <img src={imageUrl} alt="Chat attachment" className="rounded-lg max-h-48 object-cover border border-black/10" />
          </div>
        ) : null}

        {message && <p className="text-sm leading-relaxed whitespace-pre-wrap">{message}</p>}

        <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isAdmin ? "text-slate-50" : "text-slate-300"}`}>
          {timeString}
          {isAdmin && status === "read" && <CheckCheck className="w-3 h-3 text-blue-200" />}
          {isAdmin && status === "sent" && <Check className="w-3 h-3 text-blue-200" />}
        </div>
      </div>
    </div>
  );
};

const ClientListItem = ({ client, isActive, onClick }) => {
  const statusColor = {
    online: "bg-green-500",
    away: "bg-amber-400",
    offline: "bg-stone-300",
  }[client.status] || "bg-stone-300";

  return (
    <div
      onClick={onClick}
      className={`relative p-4 border-b border-stone-100 cursor-pointer flex gap-3 transition-all hover:bg-stone-100 ${isActive ? "bg-blue-100 border-l-4 border-blue-500" : "bg-white border-l-4 border-transparent"
        }`}
    >
      <div className="relative shrink-0">
        <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm bg-stone-200 text-stone-600">
          {client.avatar}
        </div>
        <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`} />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <h4 className={`font-semibold text-sm truncate pr-2 ${client.unreadCount > 0 ? "text-stone-900" : "text-stone-700"}`}>
            {client.name}
          </h4>
          <span className="text-[10px] text-stone-400 shrink-0 mt-0.5">
            {client.lastMessageAt ? new Date(client.lastMessageAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
        </div>

        <div className="flex justify-between items-center gap-2">
          <p className={`text-xs truncate ${client.unreadCount > 0 ? "font-semibold text-blue-700" : "text-stone-500"}`}>
            {client.lastMessagePreview || "No messages yet..."}
          </p>
          <div className="flex items-center gap-1.5 shrink-0">
            {client.unreadCount > 0 && (
              <span className="bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {client.unreadCount}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const ImagePreview = ({ imageFile, onRemove }) => {
  if (!imageFile) return null;
  const objectUrl = URL.createObjectURL(imageFile);
  return (
    <div className="px-4 pt-3 pb-1 border-t border-stone-200 bg-white">
      <div className="relative inline-block">
        <img src={objectUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-stone-200 shadow-sm" />
        <button onClick={onRemove} className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow hover:bg-red-500 transition-colors" type="button">
          <X className="w-3 h-3" />
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

  const handleSend = async (e) => {
    e.preventDefault();
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
    <form onSubmit={handleSend} className="bg-stone-50 border-t border-stone-200 shrink-0">
      <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />

      <div className="flex items-center gap-2 p-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-stone-400 hover:text-stone-700 hover:bg-stone-200 rounded-full transition-colors shrink-0"
        >
          <Paperclip className="w-5 h-5" />
        </button>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
          }}
        />

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Reply as Admin..."
          className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all shadow-sm"
        />

        <button
          type="submit"
          disabled={(!text.trim() && !imageFile) || sending || disabled}
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-sm"
        >
          <Send className="w-5 h-5 ml-0.5" />
        </button>
      </div>
    </form>
  );
};

const ActiveConversation = ({ client, messages, onSendMessage, onBack, isLoading, errorText }) => {
  const endOfMessagesRef = useRef(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!client) {
    return (
      <div className="flex-1 bg-stone-50 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-stone-200 text-stone-400 rounded-full flex items-center justify-center mb-4">
          <MessageCircle className="w-10 h-10" />
        </div>
        <h2 className="text-xl font-bold text-stone-700 mb-2">JJS Chat</h2>
        <p className="text-stone-500 text-sm max-w-sm">Select a client from the inbox panel on the left to view their conversation history and reply to their inquiries.</p>
      </div>
    );
  }

  const statusColor = { online: "text-green-500", away: "text-amber-500", offline: "text-stone-400" }[client.status];

  return (
    <div className="flex-1 flex flex-col bg-stone-100 h-full overflow-hidden">
      <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="md:hidden p-1.5 mr-1 text-stone-500 hover:bg-stone-100 rounded-md" type="button">
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 text-blue-700">
            {client.avatar}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-stone-800 text-base leading-tight">{client.name}</h3>
            </div>
            <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
              <Circle className={`w-2 h-2 fill-current ${statusColor}`} />
              <span className="capitalize">{client.status}</span>
              {!!client.lastOrder && (
                <>
                  <span className="text-stone-300">•</span>
                  <span className="font-mono text-stone-400">{client.lastOrder}</span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
            No message history with {client.name}.
          </div>
        ) : (
          messages.map((msg) => <AdminChatBubble key={msg.id} {...msg} />)
        )}

        {errorText && <p className="mt-2 text-xs text-red-500 text-center">{errorText}</p>}

        <div ref={endOfMessagesRef} />
      </div>
      <InputArea onSendMessage={onSendMessage} disabled={!client} />
    </div>
  );
};

const AdminDualPaneDashboard = ({ onClose, isFullScreen, toggleFullScreen, onUnreadChange }) => {
  const [clients, setClients] = useState([]);
  const [activeClientId, setActiveClientId] = useState(null);
  const [messagesByConversation, setMessagesByConversation] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [errorText, setErrorText] = useState("");

  const activeClient = clients.find((client) => client.id === activeClientId) || null;
  const activeMessages = activeClientId ? (messagesByConversation[activeClientId] || []) : [];

  const totalUnread = useMemo(
    () => clients.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0),
    [clients]
  );

  const filteredClients = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return clients
      .filter((client) => {
        if (filter === "unread" && Number(client.unreadCount || 0) <= 0) return false;
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
  }, [clients, filter, searchQuery]);

  const loadConversations = useCallback(async (silent = false) => {
    try {
      if (!silent) setIsLoadingClients(true);
      const response = await chatApi.getConversations();
      const nextClients = Array.isArray(response?.conversations)
        ? response.conversations.map(mapConversation)
        : [];

      setClients(nextClients);
      onUnreadChange?.(nextClients.reduce((sum, client) => sum + Number(client.unreadCount || 0), 0));
      setErrorText("");

      if (nextClients.length > 0 && !activeClientId) {
        setActiveClientId(nextClients[0].id);
      }
      if (activeClientId && !nextClients.some((client) => client.id === activeClientId)) {
        setActiveClientId(nextClients[0]?.id || null);
      }
    } catch (error) {
      console.error("Load conversations error:", error);
      setErrorText(error?.response?.data?.message || "Failed to load conversations");
    } finally {
      if (!silent) setIsLoadingClients(false);
    }
  }, [activeClientId, onUnreadChange]);

  const loadMessages = useCallback(async (conversationId, silent = false) => {
    if (!conversationId) return;

    try {
      if (!silent) setIsLoadingMessages(true);
      const response = await chatApi.getMessages({ conversationId });
      const nextMessages = Array.isArray(response?.messages)
        ? response.messages.map(mapMessage)
        : [];

      setMessagesByConversation((prev) => ({
        ...prev,
        [conversationId]: nextMessages,
      }));
      setErrorText("");
    } catch (error) {
      console.error("Load admin messages error:", error);
      setErrorText(error?.response?.data?.message || "Failed to load messages");
    } finally {
      if (!silent) setIsLoadingMessages(false);
    }
  }, []);

  const handleSelectClient = useCallback((conversationId) => {
    setActiveClientId(conversationId);
    setClients((prev) => prev.map((client) => (
      client.id === conversationId ? { ...client, unreadCount: 0 } : client
    )));
  }, []);

  const handleSendMessage = useCallback(async (msgObj) => {
    if (!activeClientId) return;

    const tempId = `temp-${Date.now()}`;
    const optimistic = {
      id: tempId,
      sender: "admin",
      message: msgObj.message || "",
      timestamp: new Date().toISOString(),
      type: msgObj.type || "text",
      imageUrl: msgObj.imageUrl || null,
      status: "sent",
    };

    setMessagesByConversation((prev) => ({
      ...prev,
      [activeClientId]: [...(prev[activeClientId] || []), optimistic],
    }));

    try {
      const response = await chatApi.sendMessage({
        conversationId: activeClientId,
        message: msgObj.message,
        type: msgObj.type,
        imageUrl: msgObj.imageUrl,
      });

      const persisted = mapMessage(response?.chatMessage || {});
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeClientId]: (prev[activeClientId] || []).map((message) => (
          message.id === tempId ? persisted : message
        )),
      }));

      await loadConversations(true);
    } catch (error) {
      console.error("Admin send message error:", error);
      setMessagesByConversation((prev) => ({
        ...prev,
        [activeClientId]: (prev[activeClientId] || []).filter((message) => message.id !== tempId),
      }));
      setErrorText(error?.response?.data?.message || "Failed to send message");
    }
  }, [activeClientId, loadConversations]);

  useEffect(() => {
    loadConversations(false);
    const intervalId = setInterval(() => loadConversations(true), 5000);
    return () => clearInterval(intervalId);
  }, [loadConversations]);

  useEffect(() => {
    if (!activeClientId) return undefined;

    loadMessages(activeClientId, false);
    const intervalId = setInterval(() => {
      loadMessages(activeClientId, true);
    }, 3000);

    return () => clearInterval(intervalId);
  }, [activeClientId, loadMessages]);

  return (
    <div
      className={`fixed z-[9999] flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isFullScreen
        ? "inset-0 md:inset-4 md:rounded-2xl"
        : "bottom-0 right-0 w-full h-[80vh] md:bottom-8 md:right-8 md:w-[850px] md:h-[650px] md:rounded-2xl rounded-t-2xl"
        }`}
    >
      <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center overflow-hidden shadow-sm">
            <img src={img.JJS} alt="JJS" className="w-full h-full object-contain" onError={(e) => { e.target.style.display = "none"; }} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight tracking-wide">JJS-Admin</h3>
            <p className="text-[10px] text-blue-200 font-medium">Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {totalUnread > 0 && (
            <span className="hidden md:flex items-center gap-1.5 bg-red-900 text-red-100 text-xs px-2.5 py-1 rounded-full border border-red-500/50">
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              {totalUnread} Requires Action
            </span>
          )}
          <div className="w-px h-5 bg-blue-500 mx-2 hidden md:block" />
          <button onClick={toggleFullScreen} className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors hidden md:block" type="button">
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors bg-blue-700" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className={`w-full md:w-[320px] lg:w-[350px] border-r border-stone-200 flex flex-col bg-white shrink-0 z-10 ${activeClientId ? "hidden md:flex" : "flex"}`}>
          <div className="p-4 border-b border-stone-100 bg-stone-50 shrink-0">
            <div className="relative mb-3">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors border ${filter === "all" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"}`}
                type="button"
              >
                All
              </button>
              <button
                onClick={() => setFilter("unread")}
                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors border ${filter === "unread" ? "bg-blue-500 text-white border-blue-500" : "bg-white text-stone-600 border-stone-200 hover:bg-stone-100"}`}
                type="button"
              >
                Unread
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoadingClients ? (
              <div className="p-8 text-center text-stone-400 text-sm">Loading conversations...</div>
            ) : filteredClients.length === 0 ? (
              <div className="p-8 text-center text-stone-400 text-sm">
                No clients match your current filters.
              </div>
            ) : (
              filteredClients.map((client) => (
                <ClientListItem
                  key={client.id}
                  client={client}
                  isActive={activeClientId === client.id}
                  onClick={() => handleSelectClient(client.id)}
                />
              ))
            )}
          </div>
        </div>

        <div className={`flex-1 flex-col z-0 ${!activeClientId ? "hidden md:flex" : "flex"}`}>
          <ActiveConversation
            client={activeClient}
            messages={activeMessages}
            isLoading={isLoadingMessages}
            onSendMessage={handleSendMessage}
            onBack={() => setActiveClientId(null)}
            errorText={errorText}
          />
        </div>
      </div>
    </div>
  );
};

const AdminChatLauncher = ({ onClick, unreadCount }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-[9999] ring-4 ring-blue-600/20"
      type="button"
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

export default function AdminChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [launcherUnread, setLauncherUnread] = useState(0);

  const loadUnreadCount = useCallback(async () => {
    try {
      const response = await chatApi.getConversations();
      const total = Array.isArray(response?.conversations)
        ? response.conversations.reduce((sum, conversation) => sum + Number(conversation?.unreadCount || 0), 0)
        : 0;
      setLauncherUnread(total);
    } catch (error) {
      console.error("Load admin unread count error:", error);
    }
  }, []);

  useEffect(() => {
    loadUnreadCount();
    const intervalId = setInterval(loadUnreadCount, 5000);
    return () => clearInterval(intervalId);
  }, [loadUnreadCount]);

  useEffect(() => {
    if (!isOpen) setIsFullScreen(false);
  }, [isOpen]);

  const isSmallScreen = typeof window !== "undefined" ? window.innerWidth < 768 : false;

  return (
    <>
      {!isOpen && <AdminChatLauncher onClick={() => setIsOpen(true)} unreadCount={launcherUnread} />}

      {isOpen && (
        <>
          <div
            className={`fixed inset-0 bg-stone-900/40 z-[9998] transition-opacity flex justify-center items-center ${isFullScreen || isSmallScreen ? "opacity-100" : "opacity-0 pointer-events-none"
              }`}
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          <AdminDualPaneDashboard
            onClose={() => setIsOpen(false)}
            isFullScreen={isFullScreen}
            toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
            onUnreadChange={setLauncherUnread}
          />
        </>
      )}
    </>
  );
}
