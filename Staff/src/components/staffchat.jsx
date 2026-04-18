import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    MessageCircle, X, Maximize2, Minimize2, Send, Paperclip, Check, CheckCheck,
    Search, ArrowLeft, MoreVertical
} from 'lucide-react';
import img from '../assets/img';
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
        avatar: fullName.toLowerCase() === 'admin' ? (
            <img src={img.JJS} alt="Admin" className="w-full h-full object-contain p-0.5" />
        ) : getInitials(fullName),
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
        senderId: message?.senderId || '',
        senderName: message?.senderName || '',
        message: message?.message || '',
        timestamp: message?.timestamp || message?.createdAt || new Date().toISOString(),
        type: message?.type || (message?.imageUrl ? 'image' : 'text'),
        imageUrl: message?.imageUrl || null,
        status: message?.status || 'sent',
        isEdited: Boolean(message?.isEdited),
        isDeleted: Boolean(message?.isDeleted),
        senderRole,
    };
};

const MessageActionMenu = ({ onEdit, onDeleteForEveryone, onDeleteForMe, onClose, isSystem, isDeleted, isOwn }) => {
    const ref = useRef(null);

    useEffect(() => {
        const handle = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose(); };
        document.addEventListener('mousedown', handle);
        return () => document.removeEventListener('mousedown', handle);
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
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim()) onSave(text.trim()); }
        if (e.key === 'Escape') onCancel();
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

const StaffChatBubble = ({ id, sender, senderId, senderName, message, timestamp, type, imageUrl, status, isEdited, isDeleted, senderRole, currentUserId, clientAvatar, onEdit, onDeleteForEveryone, onDeleteForMe }) => {
    const timeString = new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isSystem = senderRole === 'system';
    const isStaff = sender === 'staff';
    const isOwn = isStaff && String(senderId) === String(currentUserId);
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
        ? (isStaff ? 'bg-stone-100/80 text-stone-500 border border-stone-200 rounded-br-sm' : 'bg-white text-stone-500 border border-stone-200 rounded-bl-sm')
        : (isStaff ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-700 text-white border border-gray-800 rounded-bl-sm');

    return (
        <div className={`mb-4 flex w-full ${isStaff ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
            {!isStaff && (
                <div className="shrink-0 mb-[1px]">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold shadow-sm border uppercase overflow-hidden ${senderRole === 'admin' ? 'bg-black text-white border-slate-300/50' : 'bg-stone-200 text-stone-600 border-stone-300/50'}`}>
                        {senderRole === 'admin' ? (
                            <img src={img.JJS} alt="JJS" className="w-full h-full object-contain p-0.5" />
                        ) : (
                            senderRole === 'staff' ? getInitials(senderName || 'Staff') : (clientAvatar || 'USR')
                        )}
                    </div>
                </div>
            )}
            <div className="relative group max-w-[80%]">
                <div className={`absolute -top-1 ${isStaff ? '-left-6' : '-right-6'} flex items-start opacity-0 group-hover:opacity-100 transition-opacity z-10`}>
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

                <div className={`relative px-4 py-2.5 shadow-sm rounded-2xl ${bubbleClasses}`}>
                    {type === 'image' && imageUrl && !isDeleted ? (
                        <div className="mb-2">
                            <img src={imageUrl} alt="Chat attachment" className="max-h-48 rounded-lg border border-black/10 object-cover" />
                        </div>
                    ) : null}

                    {editing ? (
                        <InlineEditInput initialValue={message} onSave={handleSaveEdit} onCancel={() => setEditing(false)} />
                    ) : (
                        message && <p className={`whitespace-pre-wrap text-sm leading-relaxed ${isDeleted ? 'italic opacity-80' : ''}`}>{message}</p>
                    )}

                    {!editing && (
                        <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isStaff && !isDeleted ? 'text-blue-200' : 'text-slate-400'}`}>
                            {isEdited && !isDeleted && <span className="italic opacity-70 mr-1">edited</span>}
                            {timeString}
                            {isStaff && status === 'read' && !isDeleted && <CheckCheck className="h-3 w-3" />}
                            {isStaff && status === 'sent' && !isDeleted && <Check className="h-3 w-3" />}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConversationListItem = ({ conversation, isActive, onClick }) => {
    return (
        <div
            onClick={onClick}
            className={`flex cursor-pointer border-b border-stone-100 transition-all items-center gap-3 px-4 py-3 ${isActive ? 'bg-blue-200' : 'bg-stone-50 hover:bg-blue-100'
                }`}
        >
            <div className="relative shrink-0">
                <div className={`flex items-center justify-center overflow-hidden rounded-full font-bold text-white shadow-sm uppercase h-10 w-10 text-sm ${conversation.name.toLowerCase() === 'admin' ? 'bg-black' : 'bg-blue-600'}`}>
                    {conversation.avatar}
                </div>
                <div className="absolute bottom-0 right-0 rounded-full border-2 border-white bg-green-500 h-3 w-3" />
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1">
                    <h4 className={`truncate text-sm font-semibold ${conversation.unreadCount > 0 ? 'text-blue-900' : 'text-stone-800'}`}>
                        {conversation.name}
                    </h4>
                    {conversation.lastMessageAt && (
                        <span className="shrink-0 text-[10px] text-stone-400">
                            {new Date(conversation.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    )}
                </div>
                <div className="flex items-center justify-between gap-2 overflow-hidden">
                    <p className={`truncate text-[11px] ${conversation.unreadCount > 0 ? 'font-medium text-blue-600' : 'text-stone-500'}`}>
                        {conversation.lastMessagePreview || 'No messages'}
                    </p>
                    {conversation.unreadCount > 0 && (
                        <span className="flex h-4 min-w-[16px] items-center justify-center rounded-full bg-blue-600 px-1 text-[9px] font-bold text-white">
                            {conversation.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
};

const ConversationList = ({ conversations, activeConversationId, onSelect, searchQuery, setSearchQuery, filter, setFilter }) => {
    return (
        <div className={`flex w-full md:w-[280px] shrink-0 flex-col border-r border-stone-100 bg-white transition-all duration-300 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
            <div className="shrink-0 border-b border-stone-100 px-4 py-4">
                <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400" />
                    <input
                        type="text"
                        placeholder="Search customer or order.."
                        className="w-full rounded-lg border border-stone-200 bg-stone-50 py-1.5 pl-9 pr-3 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'unread'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`flex-1 rounded-md py-1 text-[11px] font-semibold capitalize transition-colors ${filter === f ? 'bg-blue-600 text-white shadow-sm' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                                }`}
                            type="button"
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div className="flex-1 overflow-y-auto pt-2">
                {conversations.length > 0 ? (
                    conversations.map((conv) => (
                        <ConversationListItem
                            key={conv.id}
                            conversation={conv}
                            isActive={activeConversationId === conv.id}
                            onClick={() => onSelect(conv.id)}
                        />
                    ))
                ) : (
                    <div className="p-6 text-center text-xs text-stone-400 font-medium">No assigned conversations</div>
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
    const [text, setText] = useState('');
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
                    placeholder="Type your message..."
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

const ActiveConversation = ({ conversation, messages, onSendMessage, isLoading, errorText, currentUserId, onEdit, onDeleteForEveryone, onDeleteForMe }) => {
    const endOfMessagesRef = useRef(null);

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'auto' });
    }, [messages.length, conversation?.id]);

    if (!conversation) {
        return (
            <div className="flex flex-1 flex-col items-center justify-center bg-stone-50 p-8 text-center animate-in fade-in duration-500">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-stone-300 shadow-inner">
                    <MessageCircle className="h-10 w-10 opacity-50" />
                </div>
                <h2 className="mb-2 text-xl font-bold text-stone-800">No Chat Selected</h2>
                <p className="max-w-sm text-sm text-stone-500 leading-relaxed font-medium">Select a conversation from the sidebar to start responding to customers.</p>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-1 flex-col overflow-hidden bg-white">
            <div className="flex flex-1 flex-col overflow-y-auto p-4 bg-stone-50/30">
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
                    messages.map((message) => (
                        <StaffChatBubble
                            key={message.id}
                            {...message}
                            currentUserId={currentUserId}
                            clientAvatar={conversation.avatar}
                            onEdit={onEdit}
                            onDeleteForEveryone={onDeleteForEveryone}
                            onDeleteForMe={onDeleteForMe}
                        />
                    ))
                )}

                {errorText ? <div className="mt-4 mx-auto p-2 px-4 bg-red-50 text-red-600 rounded-lg text-xs font-semibold border border-red-100 shadow-sm">{errorText}</div> : null}
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
    const [currentUserId, setCurrentUserId] = useState('');
    const [currentUserName, setCurrentUserName] = useState('');
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

    useEffect(() => {
        try {
            const token = localStorage.getItem('staffToken') || sessionStorage.getItem('staffToken');
            if (token) {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id || '');
                setCurrentUserName(payload.fullName || payload.name || 'Staff');
            }
        } catch { /* ignore */ }
    }, []);

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

            if (activeConversationId && !nextConversations.some((conversation) => conversation.id === activeConversationId)) {
                setActiveConversationId(null);
            }
        } catch (error) {
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
            // Error handling ignored
        }

        loadMessages(conversationId);
    }, [loadMessages]);

    const handleSendMessage = useCallback(async (msgObj) => {
        if (!activeConversationId) return;

        const tempId = `temp-${Date.now()}`;
        const optimistic = {
            id: tempId,
            sender: 'staff',
            senderId: currentUserId,
            message: msgObj.message || '',
            timestamp: new Date().toISOString(),
            type: msgObj.type || 'text',
            imageUrl: msgObj.imageUrl || null,
            status: 'sent',
            isEdited: false,
            senderRole: 'staff',
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
            setMessagesByConversation((prev) => ({
                ...prev,
                [activeConversationId]: (prev[activeConversationId] || []).filter((message) => message.id !== tempId),
            }));
            setErrorText(error?.response?.data?.message || 'Failed to send message');
        }
    }, [activeConversationId, currentUserId, loadConversations]);

    const handleEdit = useCallback(async (messageId, newText) => {
        setMessagesByConversation((prev) => {
            const updated = {};
            for (const [convId, msgs] of Object.entries(prev)) {
                updated[convId] = msgs.map((m) =>
                    m.id === messageId ? { ...m, message: newText, isEdited: true } : m
                );
            }
            return updated;
        });
        try {
            await chatApi.editMessage({ messageId, message: newText });
        } catch (error) {
            setErrorText(error?.response?.data?.message || 'Failed to edit message');
            if (activeConversationId) loadMessages(activeConversationId, true);
        }
    }, [activeConversationId, loadMessages]);

    const handleDeleteForEveryone = useCallback(async (messageId) => {
        try {
            const response = await chatApi.deleteMessageForEveryone({ messageId });
            const tombstone = mapMessage(response?.chatMessage || {});
            setMessagesByConversation((prev) => {
                const updated = {};
                for (const [convId, msgs] of Object.entries(prev)) {
                    updated[convId] = msgs.map((m) => (m.id === messageId ? tombstone : m));
                }
                return updated;
            });
            await loadConversations(true);
        } catch (error) {
            setErrorText(error?.response?.data?.message || 'Failed to delete message');
        }
    }, [loadConversations]);

    const handleDeleteForMe = useCallback(async (messageId) => {
        setMessagesByConversation((prev) => {
            const updated = {};
            for (const [convId, msgs] of Object.entries(prev)) {
                updated[convId] = msgs.filter((m) => m.id !== messageId);
            }
            return updated;
        });
        try {
            await chatApi.deleteMessageForMe({ messageId });
        } catch (error) {
            setErrorText(error?.response?.data?.message || 'Failed to hide message');
            if (activeConversationId) loadMessages(activeConversationId, true);
        }
    }, [activeConversationId, loadMessages]);

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
            className={`fixed z-[9999] flex flex-col bg-white shadow-2xl overflow-hidden transition-all duration-500 ${isFullScreen
                ? 'inset-0 md:inset-4 md:rounded-2xl'
                : 'inset-0 md:inset-auto md:bottom-24 md:right-8 md:w-[720px] md:h-[650px] md:rounded-2xl shadow-[0_30px_60px_rgba(0,0,0,0.35)]'
                }`}
        >
            <div className="flex shrink-0 z-20 shadow-sm border-b border-stone-100 overflow-hidden">
                <div
                    className={`bg-white flex items-center px-6 h-[72px] w-full md:w-[280px] shrink-0 ${activeConversationId ? "hidden md:flex" : "flex"} border-r border-stone-100`}
                >
                    <div className="flex items-center justify-between w-full">
                        <h3 className="font-extrabold text-2xl text-stone-800 tracking-tight">Chats</h3>
                        <button
                            onClick={() => window.dispatchEvent(new CustomEvent('close-staff-chat'))}
                            className="md:hidden p-1.5 -mr-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-md transition-colors"
                            type="button"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div
                    className={`flex-1 bg-blue-600 text-white px-4 h-[72px] flex items-center justify-between shadow-lg ${!activeConversationId ? "hidden md:flex" : "flex"
                        }`}
                >
                    <div className="flex items-center gap-3">
                        {activeConversationId && (
                            <button
                                onClick={() => setActiveConversationId(null)}
                                className="md:hidden p-2 -ml-1 text-white hover:bg-white/10 rounded-full transition-all active:scale-95"
                                type="button"
                                aria-label="Back to chats"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                        )}

                        {activeConversation ? (
                            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2 duration-300">
                                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold text-sm shadow-md border-2 border-white/20 overflow-hidden">
                                    {activeConversation.avatar}
                                </div>
                                <div>
                                    <h3 className="font-bold text-base leading-tight drop-shadow-sm">{activeConversation.name}</h3>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <div className="w-2 h-2 rounded-full bg-emerald-400 border border-white/20 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                                        <span className="text-[10px] font-bold text-blue-100/90 tracking-widest uppercase">Active</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 animate-in fade-in duration-300">
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white font-bold text-blue-600 shadow-md uppercase text-xs border-2 border-white/20">
                                    {getInitials(currentUserName)}
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold leading-tight tracking-wide drop-shadow-sm text-white">{currentUserName || 'JJS-Staff'}</h3>
                                    <p className="text-[10px] font-bold text-blue-100/70 uppercase tracking-tighter">Staff Inbox</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {totalUnread > 0 && !activeConversationId && (
                            <span className="hidden lg:flex items-center gap-1.5 bg-white/10 text-white text-[10px] font-extrabold px-3 py-1 rounded-full border border-white/20 uppercase tracking-widest mr-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping" />
                                {totalUnread} Unread
                            </span>
                        )}
                        <button
                            onClick={toggleFullScreen}
                            className="p-1.5 text-blue-100 hover:text-white hover:bg-white/10 rounded-md transition-all hidden md:flex items-center justify-center"
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
            </div>

            <div className="relative flex flex-1 overflow-hidden w-full">
                <ConversationList
                    conversations={filteredConversations}
                    activeConversationId={activeConversationId}
                    onSelect={handleSelectConversation}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    filter={filter}
                    setFilter={setFilter}
                />

                <div className={`flex flex-1 flex-col z-0 border-l border-stone-100 ${!activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                    <ActiveConversation
                        conversation={activeConversation}
                        messages={activeMessages}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoadingMessages}
                        errorText={errorText}
                        currentUserId={currentUserId}
                        onEdit={handleEdit}
                        onDeleteForEveryone={handleDeleteForEveryone}
                        onDeleteForMe={handleDeleteForMe}
                    />
                </div>
            </div>
        </div>
    );
};

export default function StaffChatWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [totalUnread, setTotalUnread] = useState(0);

    const handleClose = useCallback(() => {
        setIsOpen(false);
        setIsFullScreen(false);
    }, []);

    useEffect(() => {
        const handleOpenEvent = () => setIsOpen(true);
        const handleCloseEvent = () => handleClose();

        window.addEventListener('open-staff-chat', handleOpenEvent);
        window.addEventListener('close-staff-chat', handleCloseEvent);

        return () => {
            window.removeEventListener('open-staff-chat', handleOpenEvent);
            window.removeEventListener('close-staff-chat', handleCloseEvent);
        };
    }, [handleClose]);

    return (
        <React.Fragment>
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-8 md:bottom-8 md:right-8 z-[9999] flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-white shadow-2xl ring-4 ring-blue-600/10 transition-all hover:scale-110 hover:bg-blue-700 active:scale-95 group"
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
                    <StaffChatShell
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
