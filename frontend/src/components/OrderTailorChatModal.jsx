import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, MessageCircle, Paperclip, Send, UserRound, X } from 'lucide-react';
import { chatApi } from '../../services/chatApi';
import { getTrackingReferenceCode } from '../utils/trackingReference.js';

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getIncomingSenderLabel = (sender) => {
  if (sender === 'staff') return 'Tailor';
  if (sender === 'admin') return 'Admin';
  return '';
};

const MessageBubble = ({ message }) => {
  if (message.sender === 'system') {
    return (
      <div className="flex justify-center">
        <span className="max-w-[92%] break-words rounded-full border border-blue-100 bg-blue-50 px-4 py-1.5 text-center text-[11px] font-semibold text-blue-700">
          {message.message}
        </span>
      </div>
    );
  }

  const isClient = message.sender === 'client';
  const senderLabel = isClient ? '' : getIncomingSenderLabel(message.sender);
  const parsedTimestamp = message.timestamp || message.createdAt
    ? new Date(message.timestamp || message.createdAt)
    : null;
  const timeLabel = parsedTimestamp && !Number.isNaN(parsedTimestamp.getTime())
    ? parsedTimestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className={`flex ${isClient ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[88%] break-words rounded-2xl px-3.5 py-2.5 shadow-sm sm:max-w-[82%] sm:px-4 sm:py-3 ${isClient
            ? 'rounded-br-sm bg-blue-600 text-white'
            : 'rounded-bl-sm border border-slate-200 bg-white text-slate-700'
          }`}
      >
        {!isClient && senderLabel ? (
          <p className="mb-1 text-[11px] font-semibold text-slate-400">{senderLabel}</p>
        ) : null}
        {message.imageUrl ? (
          <img src={message.imageUrl} alt="Chat attachment" className="mb-2 max-h-52 max-w-full rounded-xl object-cover" />
        ) : null}
        {message.message ? <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.message}</p> : null}
        <p className={`mt-1 text-[10px] ${isClient ? 'text-blue-100' : 'text-slate-400'}`}>{timeLabel}</p>
      </div>
    </div>
  );
};

const InputBar = ({ disabled, onSend }) => {
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [sending, setSending] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if ((!text.trim() && !imageFile) || disabled || sending) return;

    try {
      setSending(true);
      const imageUrl = imageFile ? await fileToDataUrl(imageFile) : '';
      await onSend({
        message: text.trim(),
        imageUrl,
        type: imageUrl ? 'image' : 'text',
      });
      setText('');
      setImageFile(null);
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      {imageFile ? (
        <div className="px-4 pt-3">
          <div className="relative inline-flex">
            <img
              src={URL.createObjectURL(imageFile)}
              alt="Preview"
              className="h-16 w-16 rounded-xl border border-slate-200 object-cover"
            />
            <button
              type="button"
              onClick={() => setImageFile(null)}
              className="absolute -right-2 -top-2 rounded-full bg-slate-900 p-1 text-white"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : null}

      <div className="flex items-center gap-2 p-2.5 sm:p-3">
        <button
          type="button"
          disabled={disabled || sending}
          onClick={() => fileInputRef.current?.click()}
          className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 disabled:opacity-40"
        >
          <Paperclip size={18} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            if (event.target.files?.[0]) {
              setImageFile(event.target.files[0]);
            }
          }}
        />
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={disabled ? 'Tailor chat unavailable' : 'Type your message here...'}
          disabled={disabled || sending}
          className="min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-[13px] outline-none transition-all focus:border-blue-400 focus:bg-white sm:px-4 sm:text-sm"
        />
        <button
          type="submit"
          disabled={disabled || sending || (!text.trim() && !imageFile)}
          className="shrink-0 rounded-full bg-blue-600 p-2.5 text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send size={18} />
        </button>
      </div>
    </form>
  );
};

export default function OrderTailorChatModal({ order, onClose, targetStaffName }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorText, setErrorText] = useState('');
  const endRef = useRef(null);

  const subjectType = order?.bookingType ? 'booking' : 'order';
  const subjectId = order?._id;
  const targetStaff = targetStaffName || order?.assignedTailor || '';

  const loadMessages = useCallback(
    async (conversationId, silent = false) => {
      if (!conversationId) return;

      try {
        if (!silent) setLoading(true);
        const response = await chatApi.getMessages({ conversationId });
        setMessages(Array.isArray(response?.messages) ? response.messages : []);
        if (response?.conversation) {
          setConversation(response.conversation);
        }
        setErrorText('');
      } catch (error) {
        console.error('Load order chat messages error:', error);
        setErrorText(error?.response?.data?.message || 'Failed to load messages');
      } finally {
        if (!silent) setLoading(false);
      }
    },
    []
  );

  const bootstrapConversation = useCallback(async () => {
    if (!subjectId) {
      setLoading(false);
      setErrorText('Order reference is missing.');
      return;
    }

    try {
      setLoading(true);
      const response = await chatApi.openOrderConversation({ subjectType, subjectId, targetStaffName: targetStaff });
      const nextConversation = response?.conversation || null;
      setConversation(nextConversation);

      if (nextConversation?.id || nextConversation?._id) {
        await loadMessages(nextConversation.id || nextConversation._id, true);
      } else {
        setMessages([]);
      }
    } catch (error) {
      console.error('Open order chat error:', error);
      setErrorText(error?.response?.data?.message || 'Failed to open tailor chat');
      setLoading(false);
      return;
    }

    setLoading(false);
  }, [loadMessages, subjectId, subjectType, targetStaff]);

  useEffect(() => {
    bootstrapConversation();
  }, [bootstrapConversation]);

  useEffect(() => {
    const conversationId = conversation?.id || conversation?._id;
    if (!conversationId) return undefined;

    const interval = window.setInterval(() => {
      loadMessages(conversationId, true);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [conversation, loadMessages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleSendMessage = useCallback(
    async (payload) => {
      const conversationId = conversation?.id || conversation?._id;
      if (!conversationId) return;

      const tempId = `temp-${Date.now()}`;
      const optimisticMessage = {
        id: tempId,
        sender: 'client',
        senderRole: 'user',
        message: payload.message || '',
        imageUrl: payload.imageUrl || null,
        type: payload.type || 'text',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      setMessages((prev) => [...prev, optimisticMessage]);
      setErrorText('');

      try {
        const response = await chatApi.sendMessage({
          conversationId,
          message: payload.message,
          imageUrl: payload.imageUrl,
          type: payload.type,
        });

        const persistedMessage = response?.chatMessage || optimisticMessage;
        setMessages((prev) =>
          prev.map((message) => (message.id === tempId ? persistedMessage : message))
        );
      } catch (error) {
        console.error('Send order chat message error:', error);
        setMessages((prev) => prev.filter((message) => message.id !== tempId));
        setErrorText(error?.response?.data?.message || 'Failed to send message');
      }
    },
    [conversation]
  );

  const modalTitle = useMemo(() => {
    return conversation?.subjectTitle || order?.item || order?.service || 'Tailor Chat';
  }, [conversation, order]);

  const modalRefCode = useMemo(() => {
    return conversation?.subjectLabel || getTrackingReferenceCode(order);
  }, [conversation, order]);

  return (
    <>
      <div className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="fixed inset-x-0 bottom-0 top-auto z-[101] flex h-[88dvh] max-h-[720px] flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[calc(100dvh-4rem)] sm:w-[440px] sm:max-w-[calc(100vw-2rem)] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[28px] animate-modal-enter">
        <div className="flex items-center gap-2 border-b border-slate-200 px-4 py-3.5 sm:gap-3 sm:px-5 sm:py-4">
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 min-[360px]:flex">
            <UserRound size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold text-slate-900">{targetStaff || conversation?.assignedStaffName || 'Assigned Staff'}</h2>

          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-3 py-4 sm:px-4">
          {loading ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <MessageCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">Loading chat...</p>
            </div>
          ) : errorText && messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <MessageCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">{errorText}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-500">
                <MessageCircle size={28} />
              </div>
              <p className="text-sm font-semibold text-slate-700">No messages yet</p>
              <p className="mt-1 text-xs text-slate-400">This is the start of your conversation with your assigned staff.</p>
            </div>
          ) : (
            messages.map((message) => <MessageBubble key={message.id || message._id} message={message} />)
          )}

          {errorText && messages.length > 0 ? (
            <p className="text-center text-xs text-red-500">{errorText}</p>
          ) : null}
          <div ref={endRef} />
        </div>

        <InputBar disabled={!targetStaff || loading} onSend={handleSendMessage} />
      </div>
    </>
  );
}
