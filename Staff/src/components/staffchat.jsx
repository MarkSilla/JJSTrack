import React, { useState, useEffect, useRef, useMemo } from "react";
import {
    MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck,
    Search, Filter, ArrowLeft, Pin, ShieldAlert, Circle
} from "lucide-react";
import img from "../assets/img";

// =============================================================================
// MOCK DATA & STATE INITIALIZATION
// TODO (REAL DATA): Replace these static arrays with API/Supabase fetches
// =============================================================================
const INITIAL_CLIENTS = [
    { id: 'c1', name: 'John Doe', avatar: 'JD', unreadCount: 2, status: 'online', lastOrder: '#8492' },
    { id: 'c2', name: 'Maria Garcia', avatar: 'MG', unreadCount: 0, status: 'offline', lastOrder: '#8450' }
];

const INITIAL_MESSAGES = {
    'c1': [
        { id: 1, sender: 'system', message: 'Order #8492 Payment Confirmed', timestamp: new Date(Date.now() - 3600000).toISOString(), type: 'system' },
        { id: 2, sender: 'client', message: 'Hi! When will my order be ready for pickup?', timestamp: new Date(Date.now() - 1800000).toISOString(), type: 'text', status: 'read' },
        { id: 3, sender: 'client', message: 'Can you expedite it?', timestamp: new Date(Date.now() - 1700000).toISOString(), type: 'text', status: 'read' }
    ],
    'c2': [
        { id: 1, sender: 'staff', message: 'Your repair is complete and ready for pickup.', timestamp: new Date(Date.now() - 86400000).toISOString(), type: 'text', status: 'read' },
        { id: 2, sender: 'client', message: 'Thanks, I will pick it up today.', timestamp: new Date(Date.now() - 82400000).toISOString(), type: 'text', status: 'read' }
    ]
};

// =============================================================================
// ChatBubble Component
// =============================================================================
const StaffChatBubble = ({ sender, message, timestamp, type, imageUrl, status }) => {
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (type === 'system') {
        return (
            <div className="flex w-full justify-center mb-4 my-2">
                <span className="bg-blue-50 text-blue-700 text-[11px] font-semibold px-4 py-1.5 rounded-full border border-blue-100 shadow-sm">
                    {message}
                </span>
            </div>
        );
    }

    const isStaff = sender === "staff";

    return (
        <div className={`flex w-full ${isStaff ? "justify-end" : "justify-start"} mb-4`}>
            <div
                className={`max-w-[80%] md:max-w-[70%] px-4 py-2.5 shadow-sm relative ${isStaff
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

                <div className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isStaff ? "text-slate-50" : "text-slate-300 "}`}>
                    {timeString}
                    {isStaff && status === "read" && <CheckCheck className="w-3 h-3 text-blue-200" />}
                    {isStaff && status === "sent" && <Check className="w-3 h-3 text-blue-200" />}
                </div>
            </div>
        </div>
    );
};

// =============================================================================
// Client ListItem Component
// =============================================================================
const ClientListItem = ({ client, lastMessage, isActive, onClick }) => {
    const statusColor = {
        online: 'bg-green-500',
        away: 'bg-amber-400',
        offline: 'bg-stone-300'
    }[client.status] || 'bg-stone-300';

    let snippet = lastMessage?.message || 'No messages yet...';
    if (lastMessage?.type === 'image') snippet = '📷 Image attachment';
    if (lastMessage?.type === 'system') snippet = `[System] ${lastMessage.message}`;

    return (
        <div
            onClick={onClick}
            className={`relative p-4 border-b border-stone-100 cursor-pointer flex gap-3 transition-all hover:bg-stone-100 ${isActive ? 'bg-blue-100 border-l-4 border-blue-500' : 'bg-white border-l-4 border-transparent'}`}
        >
            <div className="relative shrink-0">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm bg-stone-200 text-stone-600`}>
                    {client.avatar}
                </div>
                <div className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white ${statusColor}`}></div>
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start mb-0.5">
                    <h4 className={`font-semibold text-sm truncate pr-2 ${client.unreadCount > 0 ? 'text-stone-900' : 'text-stone-700'}`}>
                        {client.name}
                    </h4>
                    <span className="text-[10px] text-stone-400 shrink-0 mt-0.5">
                        {lastMessage ? new Date(lastMessage.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                </div>

                <div className="flex justify-between items-center gap-2">
                    <p className={`text-xs truncate ${client.unreadCount > 0 ? 'font-semibold text-blue-700' : 'text-stone-500'}`}>
                        {snippet}
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

// =============================================================================
// ImagePreview Component
// =============================================================================
const ImagePreview = ({ imageFile, onRemove }) => {
    if (!imageFile) return null;
    const objectUrl = URL.createObjectURL(imageFile);
    return (
        <div className="px-4 pt-3 pb-1 border-t border-stone-200 bg-white">
            <div className="relative inline-block">
                <img src={objectUrl} alt="Preview" className="h-20 w-20 object-cover rounded-lg border border-stone-200 shadow-sm" />
                <button onClick={onRemove} className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1 shadow hover:bg-red-500 transition-colors">
                    <X className="w-3 h-3" />
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// Staff InputArea Component
// =============================================================================
const InputArea = ({ onSendMessage }) => {
    const [text, setText] = useState("");
    const [imageFile, setImageFile] = useState(null);
    const fileInputRef = useRef(null);

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim() && !imageFile) return;

        // TODO (REAL DATA): Upload `imageFile` to your server/Supabase and use the public URL here instead of URL.createObjectURL
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
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={(e) => {
                    if (e.target.files && e.target.files[0]) setImageFile(e.target.files[0]);
                }} />

                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Reply as Staff..."
                    className="flex-1 bg-white border border-stone-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:border-stone-400 focus:ring-1 focus:ring-stone-400 transition-all shadow-sm"
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

// =============================================================================
// Chat Window (Active Conversation) Component
// =============================================================================
const ActiveConversation = ({ client, messages, onSendMessage, onBack, isTyping, quickReplies }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

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

    const statusColor = { online: 'text-green-500', away: 'text-amber-500', offline: 'text-stone-400' }[client.status];

    return (
        <div className="flex-1 flex flex-col bg-stone-100 h-full overflow-hidden">
            {/* Active Conversation Header */}
            <div className="bg-white border-b border-stone-200 px-4 py-3 flex items-center justify-between shrink-0 shadow-sm z-10">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="md:hidden p-1.5 mr-1 text-stone-500 hover:bg-stone-100 rounded-md">
                        <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm bg-blue-100 text-blue-700`}>
                        {client.avatar}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-stone-800 text-base leading-tight">{client.name}</h3>
                        </div>
                        <p className="text-xs text-stone-500 flex items-center gap-1.5 mt-0.5">
                            <Circle className={`w-2 h-2 fill-current ${statusColor}`} />
                            <span className="capitalize">{client.status}</span>
                            <span className="text-stone-300">•</span>
                            <span className="font-mono text-stone-400">Order {client.lastOrder}</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-stone-400 text-sm">
                        No message history with {client.name}.
                    </div>
                ) : (
                    messages.map((msg) => <StaffChatBubble key={msg.id} {...msg} />)
                )}

                {isTyping && (
                    <div className="flex w-full justify-start mb-4">
                        <div className="bg-gradient-to-r from-blue-100 to-blue-200 border border-blue-300 text-blue-900 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm flex gap-1">
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                )}

                {/* ikaw nalang mamili if remove to Quick Replies */}
                {messages.length > 0 && messages[messages.length - 1]?.sender === "client" && quickReplies && (
                    <div className="flex flex-wrap gap-2 mt-2 mb-2 justify-end">
                        {quickReplies.map((qr, idx) => (
                            <button
                                key={idx}
                                onClick={() => onSendMessage({ message: qr, type: "text", imageUrl: null })}
                                className="text-xs font-semibold text-stone-600 bg-white hover:bg-stone-50 border border-stone-200 rounded-full px-3 py-1.5 transition-colors shadow-sm"
                            >
                                {qr}
                            </button>
                        ))}
                    </div>
                )}

                <div ref={endOfMessagesRef} />
            </div>
            <InputArea onSendMessage={onSendMessage} />
        </div>
    );
};


const StaffDualPaneDashboard = ({ onClose, isFullScreen, toggleFullScreen }) => {
    //TODO (REAL DATA): Fetch initial clients and messages from API
    const [clients, setClients] = useState(INITIAL_CLIENTS);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);

    const [activeClientId, setActiveClientId] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState("all"); // 'all', 'unread'
    const [clientTyping, setClientTyping] = useState({});

    const activeClient = clients.find(c => c.id === activeClientId);
    const activeMessages = activeClient ? (messages[activeClientId] || []) : [];

    const QUICK_REPLIES = ["Please provide your order #", "Your repair is delayed.", "Payment received!"];

    // Filter & Sort Clients
    const filteredClients = useMemo(() => {
        return clients
            .filter(c => {
                if (filter === 'unread' && c.unreadCount === 0) return false;
                if (searchQuery && !c.name.toLowerCase().includes(searchQuery.toLowerCase()) && !c.lastOrder.includes(searchQuery)) return false;
                return true;
            })
            .sort((a, b) => {
                if (a.isPinned && !b.isPinned) return -1;
                if (!a.isPinned && b.isPinned) return 1;
                return b.unreadCount - a.unreadCount;
            });
    }, [clients, filter, searchQuery]);

    // Handle selecting a client (marks messages as read)
    const handleSelectClient = (clientId) => {
        setActiveClientId(clientId);
        setClients(prev => prev.map(c => c.id === clientId ? { ...c, unreadCount: 0 } : c));
    };

    // Handle Staff Sending a Message
    const handleSendMessage = (msgObj) => {
        if (!activeClientId) return;

        const newMessage = {
            id: Date.now(),
            sender: "staff",
            message: msgObj.message,
            timestamp: new Date().toISOString(),
            type: msgObj.type,
            // Replace with true secure URL
            imageUrl: msgObj.imageUrl,
            status: "sent"
        };

        setMessages(prev => ({
            ...prev,
            [activeClientId]: [...(prev[activeClientId] || []), newMessage]
        }));
        // REMOVE THIS SIMULATION BLOCK BELOW
        setClientTyping(prev => ({ ...prev, [activeClientId]: true }));
        setTimeout(() => {
            // Mark staff message as read
            setMessages(prev => ({
                ...prev,
                [activeClientId]: prev[activeClientId].map(m => m.id === newMessage.id ? { ...m, status: "read" } : m)
            }));

            setTimeout(() => {
                setClientTyping(prev => ({ ...prev, [activeClientId]: false }));
                const simulatedReply = {
                    id: Date.now() + 1,
                    sender: "client",
                    message: "Thank you for the update. I will note this down.",
                    timestamp: new Date().toISOString(),
                    type: "text",
                    status: "read"
                };
                setMessages(prev => ({
                    ...prev,
                    [activeClientId]: [...(prev[activeClientId] || []), simulatedReply]
                }));

                // If client is not active, increase unread badge
                setClients(prevClients => prevClients.map(c => {
                    if (c.id === activeClientId && activeClientId !== c.id) { // logic simplified for simulation
                        return { ...c, unreadCount: c.unreadCount + 1 };
                    }
                    return c;
                }));
            }, 1000);
        }, 1500);
        // =====================================================================
    };

    const totalUnread = clients.reduce((acc, c) => acc + c.unreadCount, 0);

    return (
        <div
            className={`fixed z-[9999] flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-300 ${isFullScreen
                ? "inset-0 md:inset-4 md:rounded-2xl"
                : "bottom-0 right-0 w-full h-[80vh] md:bottom-8 md:right-8 md:w-[850px] md:h-[650px] md:rounded-2xl rounded-t-2xl"
                }`}
        >
            {/* Top Main Header */}
            <div className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between shrink-0 shadow-md z-20">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 flex items-center justify-center overflow-hidden shadow-sm bg-white rounded-full">
                        <img src={img?.JJS} alt="JJS" className="w-full h-full object-contain p-1" onError={(e) => { e.target.style.display = 'none'; }} />
                    </div>
                    <div>
                        <h3 className="font-bold text-sm leading-tight tracking-wide">JJS-Staff</h3>
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
                    <div className="w-px h-5 bg-blue-500 mx-2 hidden md:block"></div>
                    <button onClick={toggleFullScreen} className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors hidden md:block">
                        {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={onClose} className="p-1.5 text-blue-200 hover:text-white hover:bg-blue-700 rounded-md transition-colors bg-blue-700">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                <div className={`w-full md:w-[320px] lg:w-[350px] border-r border-stone-200 flex flex-col bg-white shrink-0 z-10 ${activeClientId ? 'hidden md:flex' : 'flex'}`}>

                    <div className="p-4 border-b border-stone-100 bg-stone-50 shrink-0">
                        <div className="relative mb-3">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search name or order #..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-sm"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors border ${filter === 'all' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`flex-1 text-xs font-semibold py-1.5 rounded-md transition-colors border ${filter === 'unread' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-100'}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {filteredClients.length === 0 ? (
                            <div className="p-8 text-center text-stone-400 text-sm">
                                No clients match your current filters.
                            </div>
                        ) : (
                            filteredClients.map(client => (
                                <ClientListItem
                                    key={client.id}
                                    client={client}
                                    lastMessage={(messages[client.id] || []).slice(-1)[0]}
                                    isActive={activeClientId === client.id}
                                    onClick={() => handleSelectClient(client.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* RIGHT PANE: Chat Interface */}
                <div className={`flex-1 flex-col z-0 ${!activeClientId ? 'hidden md:flex' : 'flex'}`}>
                    <ActiveConversation
                        client={activeClient}
                        messages={activeMessages}
                        isTyping={clientTyping[activeClientId]}
                        onSendMessage={handleSendMessage}
                        onBack={() => setActiveClientId(null)}
                        quickReplies={QUICK_REPLIES}
                    />
                </div>

            </div>
        </div>
    );
};

//num component
const StaffChatLauncher = ({ onClick, unreadCount }) => {
    return (
        <button
            onClick={onClick}
            className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-xl hover:bg-blue-700 hover:scale-105 active:scale-95 transition-all z-[9999] ring-4 ring-blue-600/20"
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
//main widget
export default function StaffChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    useEffect(() => {
        if (!isOpen) setIsFullScreen(false);
    }, [isOpen]);

    const totalUnread = INITIAL_CLIENTS.reduce((acc, c) => acc + c.unreadCount, 0);

    return (
        <>
            {!isOpen && <StaffChatLauncher onClick={() => setIsOpen(true)} unreadCount={totalUnread} />}

            {isOpen && (
                <>
                    <div
                        className={`fixed inset-0 bg-stone-900/40 z-[9998] transition-opacity flex justify-center items-center ${isFullScreen || window.innerWidth < 768 ? "opacity-100" : "opacity-0 pointer-events-none"
                            }`}
                        onClick={() => setIsOpen(false)}
                    />

                    <StaffDualPaneDashboard
                        onClose={() => setIsOpen(false)}
                        isFullScreen={isFullScreen}
                        toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                    />
                </>
            )}
        </>
    );
}
