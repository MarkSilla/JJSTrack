import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck,
    Search, ArrowLeft, ShieldAlert, Circle
} from 'lucide-react';
import { chatApi } from '../services/chatApi';

const fileToDataUrl = (file) =>
    new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ''));
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });

const getInitials = (name) => {
    const value = String(name || '').trim();
    if (!value) return 'U';
    return value
        .split(' ')
        .slice(0, 2)
        .map((part) => part.charAt(0).toUpperCase())
        .join('');
};

const mapConversation = (conversation) => {
    const fullName = conversation?.user?.fullName || 'Unknown User';
    return {
        id: conversation?.id || conversation?._id,
        name: fullName,
        avatar: getInitials(fullName),
        unreadCount: Number(conversation?.unreadCount || 0),
        status: 'online',
        subjectLabel: conversation?.subjectLabel || '',
        subjectTitle: conversation?.subjectTitle || '',
        assignedStaffName: conversation?.assignedStaffName || '',
        lastOrder: conversation?.subjectLabel || conversation?.subjectTitle || conversation?.user?.email || '',
        lastMessagePreview: conversation?.lastMessagePreview || '',
        lastMessageAt: conversation?.lastMessageAt || null,
    };
};

const mapMessage = (message) => {
    const senderRole = String(message?.senderRole || '').toLowerCase();
    return {
        id: message?.id || message?._id || Date.now(),
        sender: senderRole === 'user' ? 'client' : senderRole === 'staff' ? 'staff' : senderRole === 'system' ? 'system' : 'admin',
        message: message?.message || '',
        timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
        type: message?.type || (message?.imageUrl ? 'image' : 'text'),
        imageUrl: message?.imageUrl || null,
        status: message?.status || 'sent',
        senderRole,
    };
};

const StaffChatBubble = ({ sender, message, timestamp, type, imageUrl, status }) => {
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (sender === 'system') {
        return (
            <div className="my-2 flex w-full justify-center">
                <span className="rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-[11px] font-semibold text-blue-700 shadow-sm">
                    {message}
                </span>
            </div>
        );
    }

    const isStaff = sender === 'staff';

    return (
        <div className={`mb-4 flex w-full ${isStaff ? 'justify-end' : 'justify-start'}`}>
            <div
                className={`relative max-w-[80%] px-4 py-2.5 shadow-sm ${
                    isStaff
                        ? 'rounded-2xl rounded-br-sm bg-blue-600 text-white'
                        : 'rounded-2xl rounded-bl-sm border border-gray-800 bg-gray-700 text-white'
                }`}
            >
                {type === 'image' && imageUrl ? (
                    <div className="mb-2">
                        <img src={imageUrl} alt="Chat attachment" className="max-h-48 rounded-lg border border-black/10 object-cover" />
                    </div>
                ) : null}

                {message && <p className="whitespace-pre-wrap text-sm leading-relaxed">{message}</p>}

                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isStaff ? 'text-blue-200' : 'text-slate-300'}`}>
                    {timeString}
                    {isStaff && status === 'read' && <CheckCheck className="h-3 w-3 text-blue-200" />}
                    {isStaff && status === 'sent' && <Check className="h-3 w-3 text-blue-200" />}
                </div>
            </div>
        </div>
    );
};

const ConversationListItem = ({ conversation, isActive, onClick }) => (
    <div
        onClick={onClick}
        className={`relative flex cursor-pointer gap-3 border-b border-stone-100 p-4 transition-all hover:bg-stone-100 ${
            isActive ? 'border-l-4 border-blue-500 bg-blue-100' : 'border-l-4 border-transparent bg-white'
        }`}
    >
        <div className="relative shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-stone-200 text-lg font-bold text-stone-600 shadow-sm">
                {conversation.avatar}
            </div>
            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-green-500" />
        </div>

        <div className="min-w-0 flex-1">
            <div className="mb-0.5 flex items-start justify-between">
                <h4 className={`truncate pr-2 text-sm font-semibold ${conversation.unreadCount > 0 ? 'text-stone-900' : 'text-stone-700'}`}>
                    {conversation.name}
                </h4>
                <span className="mt-0.5 shrink-0 text-[10px] text-stone-400">
                    {conversation.lastMessageAt
                        ? new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : ''}
                </span>
            </div>

            <p className="truncate text-[11px] font-semibold text-blue-600">{conversation.subjectLabel || conversation.subjectTitle || 'Assigned order chat'}</p>

            <div className="mt-1 flex items-center justify-between gap-2">
                <p className={`truncate text-xs ${conversation.unreadCount > 0 ? 'font-semibold text-blue-700' : 'text-stone-500'}`}>
                    {conversation.lastMessagePreview || 'No messages yet...'}
                </p>
                {conversation.unreadCount > 0 && (
                    <span className="min-w-[20px] rounded-full bg-blue-500 px-1.5 py-0.5 text-center text-[10px] font-bold text-white">
                        {conversation.unreadCount}
                    </span>
                )}
            </div>
        </div>
    </div>
);

const ImagePreview = ({ imageFile, onRemove }) => {
    if (!imageFile) return null;
    const objectUrl = URL.createObjectURL(imageFile);

    return (
        <div className="border-t border-stone-200 bg-white px-4 pb-1 pt-3">
            <div className="relative inline-block">
                <img src={objectUrl} alt="Preview" className="h-20 w-20 rounded-lg border border-stone-200 object-cover shadow-sm" />
                <button onClick={onRemove} className="absolute -right-2 -top-2 rounded-full bg-blue-600 p-1 text-white shadow transition-colors hover:bg-red-500" type="button">
                    <X className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
};

const InputArea = ({ onSendMessage, disabled }) => {
    const [text, setText] = useState('');
    const [imageFile, setImageFile] = useState(null);
    const [sending, setSending] = useState(false);
    const fileInputRef = useRef(null);

    const handleSend = async (event) => {
        event.preventDefault();
        if ((!text.trim() && !imageFile) || sending || disabled) return;

        try {
            setSending(true);
            const imageUrl = imageFile ? await fileToDataUrl(imageFile) : null;
            await onSendMessage({
                message: text.trim(),
                type: imageUrl ? 'image' : 'text',
                imageUrl,
            });
            setText('');
            setImageFile(null);
        } finally {
            setSending(false);
        }
    };

    return (
        <form onSubmit={handleSend} className="shrink-0 border-t border-stone-200 bg-stone-50">
            <ImagePreview imageFile={imageFile} onRemove={() => setImageFile(null)} />

            <div className="flex items-center gap-2 p-3">
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="shrink-0 rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-200 hover:text-stone-700"
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
                    placeholder="Reply to this customer..."
                    disabled={disabled || sending}
                    className="flex-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm shadow-sm transition-all focus:border-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
                />

                <button
                    type="submit"
                    disabled={(!text.trim() && !imageFile) || sending || disabled}
                    className="shrink-0 rounded-full bg-blue-600 p-2 text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <Send className="ml-0.5 h-5 w-5" />
                </button>
            </div>
        </form>
    );
};

const ActiveConversation = ({ conversation, messages, onSendMessage, onBack, isLoading, errorText }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    if (!conversation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-stone-50 p-8 text-center">
                <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-stone-200 text-stone-400">
                    <MessageCircle className="h-10 w-10" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-stone-700">Tailor Inbox</h2>
                <p className="max-w-sm text-sm text-stone-500">Select an assigned order chat from the left to respond directly to the customer.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col overflow-hidden bg-stone-100">
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-stone-200 bg-white px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="mr-1 rounded-md p-1.5 text-stone-500 hover:bg-stone-100 md:hidden" type="button">
                        <ArrowLeft className="h-5 w-5" />
                    </button>

                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
                        {conversation.avatar}
                    </div>
                    <div>
                        <h3 className="text-base font-bold leading-tight text-stone-800">{conversation.name}</h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-stone-500">
                            <Circle className="h-2 w-2 fill-current text-green-500" />
                            <span className="capitalize">{conversation.status}</span>
                            {!!conversation.lastOrder && (
                                <>
                                    <span className="text-stone-300">•</span>
                                    <span className="font-mono text-stone-400">{conversation.lastOrder}</span>
                                </>
                            )}
                        </p>
                        {conversation.subjectTitle ? (
                            <p className="mt-0.5 text-[11px] font-semibold text-blue-600">{conversation.subjectTitle}</p>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 flex-col overflow-y-auto p-4">
                {isLoading ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-stone-400">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center text-sm text-stone-400">No message history with {conversation.name}.</div>
                ) : (
                    messages.map((message) => <StaffChatBubble key={message.id} {...message} />)
                )}

                {errorText ? <p className="mt-2 text-center text-xs text-red-500">{errorText}</p> : null}
                <div ref={endOfMessagesRef} />
            </div>
            <InputArea onSendMessage={onSendMessage} disabled={!conversation} />
        </div>
    );
};

const StaffChatShell = ({ onClose, isFullScreen, toggleFullScreen, onUnreadChange }) => {
    const [conversations, setConversations] = useState([]);
    const [activeConversationId, setActiveConversationId] = useState(null);
    const [messagesByConversation, setMessagesByConversation] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [isLoadingConversations, setIsLoadingConversations] = useState(false);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [errorText, setErrorText] = useState('');

    const activeConversation = conversations.find((conversation) => conversation.id === activeConversationId) || null;
    const activeMessages = activeConversationId ? (messagesByConversation[activeConversationId] || []) : [];

    const totalUnread = useMemo(
        () => conversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0),
        [conversations]
    );

    const filteredConversations = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        return conversations
            .filter((conversation) => {
                if (filter === 'unread' && Number(conversation.unreadCount || 0) <= 0) return false;
                if (!query) return true;

                return [
                    conversation.name,
                    conversation.lastOrder,
                    conversation.subjectTitle,
                    conversation.lastMessagePreview,
                ]
                    .join(' ')
                    .toLowerCase()
                    .includes(query);
            })
            .sort((a, b) => {
                const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
                const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
                return bTime - aTime;
            });
    }, [conversations, filter, searchQuery]);

    const loadConversations = useCallback(async (silent = false) => {
        try {
            if (!silent) setIsLoadingConversations(true);
            const response = await chatApi.getConversations({ scope: 'order' });
            const nextConversations = Array.isArray(response?.conversations)
                ? response.conversations.map(mapConversation)
                : [];

            setConversations(nextConversations);
            onUnreadChange?.(nextConversations.reduce((sum, conversation) => sum + Number(conversation.unreadCount || 0), 0));
            setErrorText('');

            if (nextConversations.length > 0 && !activeConversationId) {
                setActiveConversationId(nextConversations[0].id);
            }
            if (activeConversationId && !nextConversations.some((conversation) => conversation.id === activeConversationId)) {
                setActiveConversationId(nextConversations[0]?.id || null);
            }
        } catch (error) {
            console.error('Load staff conversations error:', error);
            setErrorText(error?.response?.data?.message || 'Failed to load assigned chats');
        } finally {
            if (!silent) setIsLoadingConversations(false);
        }
    }, [activeConversationId, onUnreadChange]);

    const loadMessages = useCallback(async (conversationId, silent = false) => {
        if (!conversationId) return;

        try {
            if (!silent) setIsLoadingMessages(true);
            const response = await chatApi.getMessages({ conversationId });
            const nextMessages = Array.isArray(response?.messages) ? response.messages.map(mapMessage) : [];

            setMessagesByConversation((prev) => ({
                ...prev,
                [conversationId]: nextMessages,
            }));
            setErrorText('');
        } catch (error) {
            console.error('Load staff messages error:', error);
            setErrorText(error?.response?.data?.message || 'Failed to load messages');
        } finally {
            if (!silent) setIsLoadingMessages(false);
        }
    }, []);

    const handleSelectConversation = useCallback(async (conversationId) => {
        setActiveConversationId(conversationId);
        setConversations((prev) => prev.map((conversation) => (
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation
        )));

        try {
            await chatApi.markConversationRead({ conversationId });
        } catch (error) {
            console.error('Mark staff conversation read error:', error);
        }

        loadMessages(conversationId);
    }, [loadMessages]);

    const handleSendMessage = useCallback(async (msgObj) => {
        if (!activeConversationId) return;

        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            sender: 'staff',
            message: msgObj.message || '',
            timestamp: new Date().toISOString(),
            type: msgObj.type || 'text',
            imageUrl: msgObj.imageUrl || null,
            status: 'sent',
        };

        setMessagesByConversation((prev) => ({
            ...prev,
            [activeConversationId]: [...(prev[activeConversationId] || []), optimistic],
        }));

        try {
            const response = await chatApi.sendMessage({
                conversationId: activeConversationId,
                message: msgObj.message,
                type: msgObj.type,
                imageUrl: msgObj.imageUrl,
            });

            const persisted = mapMessage(response?.chatMessage || {});
            setMessagesByConversation((prev) => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).map((message) => (
                    message.id === tempId ? persisted : message
                )),
            }));

            await loadConversations(true);
        } catch (error) {
            console.error('Staff send message error:', error);
            setMessagesByConversation((prev) => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).filter((message) => message.id !== tempId),
            }));
            setErrorText(error?.response?.data?.message || 'Failed to send message');
        }
    }, [activeConversationId, loadConversations]);

    useEffect(() => {
        loadConversations();
    }, [loadConversations]);

    useEffect(() => {
        if (!activeConversationId) return;
        if (messagesByConversation[activeConversationId]) return;
        loadMessages(activeConversationId);
    }, [activeConversationId, loadMessages, messagesByConversation]);

    useEffect(() => {
        const interval = window.setInterval(() => {
            loadConversations(true);
            if (activeConversationId) {
                loadMessages(activeConversationId, true);
            }
        }, 5000);

        return () => window.clearInterval(interval);
    }, [activeConversationId, loadConversations, loadMessages]);

    return (
        <div
            className={`fixed z-[9999] flex flex-col overflow-hidden bg-white shadow-2xl transition-all duration-300 ${
                isFullScreen
                    ? 'inset-0 md:inset-4 md:rounded-2xl'
                    : 'bottom-0 right-0 h-[80vh] w-full rounded-t-2xl md:bottom-8 md:right-8 md:h-[650px] md:w-[850px] md:rounded-2xl'
            }`}
        >
            <div className="z-20 flex shrink-0 items-center justify-between bg-blue-600 px-4 py-3 text-white shadow-md">
                <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white font-bold text-blue-600 shadow-sm">
                        J
                    </div>
                    <div>
                        <h3 className="text-sm font-bold leading-tight tracking-wide">JJS-Staff</h3>
                        <p className="text-[10px] font-medium text-blue-200">Assigned Order Chats</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {totalUnread > 0 && (
                        <span className="hidden items-center gap-1.5 rounded-full border border-red-500/50 bg-red-900 px-2.5 py-1 text-xs text-red-100 md:flex">
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
                            {totalUnread} Requires Action
                        </span>
                    )}
                    <div className="mx-2 hidden h-5 w-px bg-blue-500 md:block" />
                    <button onClick={toggleFullScreen} className="hidden rounded-md p-1.5 text-blue-200 transition-colors hover:bg-blue-700 hover:text-white md:block" type="button">
                        {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                    </button>
                    <button onClick={onClose} className="rounded-md bg-blue-700 p-1.5 text-blue-200 transition-colors hover:bg-blue-700 hover:text-white" type="button">
                        <X className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className={`z-10 flex w-full shrink-0 flex-col border-r border-stone-200 bg-white md:w-[320px] lg:w-[350px] ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="shrink-0 border-b border-stone-100 bg-stone-50 p-4">
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <input
                                type="text"
                                placeholder="Search customer or order..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                className="w-full rounded-lg border border-stone-200 bg-white py-2 pl-9 pr-4 text-sm shadow-sm transition-all focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors ${filter === 'all' ? 'border-blue-600 bg-blue-600 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilter('unread')}
                                className={`flex-1 rounded-md border py-1.5 text-xs font-semibold transition-colors ${filter === 'unread' ? 'border-blue-500 bg-blue-500 text-white' : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-100'}`}
                            >
                                Unread
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {isLoadingConversations ? (
                            <div className="p-8 text-center text-sm text-stone-400">Loading assigned chats...</div>
                        ) : filteredConversations.length === 0 ? (
                            <div className="p-8 text-center text-sm text-stone-400">No assigned order chats yet.</div>
                        ) : (
                            filteredConversations.map((conversation) => (
                                <ConversationListItem
                                    key={conversation.id}
                                    conversation={conversation}
                                    isActive={activeConversationId === conversation.id}
                                    onClick={() => handleSelectConversation(conversation.id)}
                                />
                            ))
                        )}
                    </div>
                </div>

                <div className={`z-0 flex-1 flex-col ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ActiveConversation
                        conversation={activeConversation}
                        messages={activeMessages}
                        onSendMessage={handleSendMessage}
                        onBack={() => setActiveConversationId(null)}
                        isLoading={isLoadingMessages}
                        errorText={errorText}
                    />
                </div>
            </div>
        </div>
    );
};

const StaffChatLauncher = ({ onClick, unreadCount }) => (
    <button
        onClick={onClick}
        className="fixed bottom-6 right-6 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-blue-600/20 transition-all hover:scale-105 hover:bg-blue-700 active:scale-95"
    >
        <MessageCircle className="h-7 w-7" />
        {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 text-xs font-bold text-white shadow-sm">
                {unreadCount}
            </span>
        )}
    </button>
);

export default function StaffChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsFullScreen(false);
    }, []);

    return (
        <>
            {!isOpen && <StaffChatLauncher onClick={() => setIsOpen(true)} unreadCount={totalUnread} />}

            {isOpen && (
                <>
                    <div
                        className={`fixed inset-0 z-[9998] flex items-center justify-center bg-stone-900/40 transition-opacity ${
                            isFullScreen || window.innerWidth < 768 ? 'opacity-100' : 'pointer-events-none opacity-0'
                        }`}
                        onClick={handleClose}
                    />

                    <StaffChatShell
                        onClose={handleClose}
                        isFullScreen={isFullScreen}
                        toggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                        onUnreadChange={setTotalUnread}
                    />
                </>
            )}
        </>
    );
}
