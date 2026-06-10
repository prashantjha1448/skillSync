import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, Paperclip, Loader2, Wifi, WifiOff, ArrowLeft, Home } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import { socketService } from '../../services/socket';

const Messages = () => {
  const { user, token } = useSelector((s) => s.auth);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [searchParams] = useSearchParams();
  const selectJobId = searchParams.get('jobId');
  const selectOtherUserId = searchParams.get('otherUserId');

  const [activeRoom, setActiveRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [connected, setConnected] = useState(false);
  const [search, setSearch] = useState('');
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  // Conversation list via TanStack Query
  const { data: conversations = [], isLoading: convoLoading } = useQuery({
    queryKey: ['conversations'],
    queryFn: () => api.get('/messages/conversations').then((r) => r.data?.conversations ?? r.data ?? []),
  });

  // Automatically select room if query params match, or build a temp fallback
  useEffect(() => {
    if (selectJobId && selectOtherUserId) {
      const match = conversations.find(
        (c) => String(c.jobId) === String(selectJobId) && String(c.otherUserId) === String(selectOtherUserId)
      );
      if (match) {
        setActiveRoom(match);
      } else if (!convoLoading) {
        // Fetch user and job info to build a dummy/temp room so we can initiate chat
        Promise.all([
          api.get(`/profile/user/${selectOtherUserId}`).catch(() => null),
          api.get(`/jobs/${selectJobId}`).catch(() => null)
        ]).then(([userRes, jobRes]) => {
          const uData = userRes?.data?.data || userRes?.data;
          const jData = jobRes?.data?.data || jobRes?.data;
          if (uData) {
            setActiveRoom({
              jobId: selectJobId,
              otherUserId: selectOtherUserId,
              jobTitle: jData?.job?.title || jData?.title || 'Job Thread',
              name: uData.name,
              profilePic: uData.profilePic || uData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uData.name}`,
              lastMessage: '',
              lastMessageTime: '',
              unreadCount: 0,
              isTemp: true
            });
          }
        });
      }
    }
  }, [conversations, convoLoading, selectJobId, selectOtherUserId]);

  // Load history when room changes
  useEffect(() => {
    if (!activeRoom) return;
    api.get(`/messages/${activeRoom.jobId}/${activeRoom.otherUserId}`)
      .then((r) => setMessages(r.data?.data ?? []))
      .catch(() => setMessages([]));
  }, [activeRoom]);

  // Socket setup
  useEffect(() => {
    if (!token) return;
    const socket = socketService.connect(token);
    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('receive_message', (msg) => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
      setMessages((prev) => {
        if (prev.some((m) => m._id === msg._id)) return prev;
        const myId = user?._id || user?.id;
        if (myId && (msg.sender === myId || msg.senderId === myId)) {
          const tempIdx = prev.findIndex((m) => String(m._id).startsWith('temp_') && m.text === msg.text);
          if (tempIdx !== -1) {
            const updated = [...prev];
            updated[tempIdx] = msg;
            return updated;
          }
        }
        return [...prev, msg];
      });
    });
    socket.on('typing_status', ({ userId, isTyping: t }) => { if (userId !== (user?._id || user?.id)) setIsTyping(t); });
    return () => {
      socket.off('receive_message');
      socket.off('typing_status');
    };
  }, [token, user?._id, user?.id, qc]);

  // Join room
  useEffect(() => {
    if (!activeRoom) return;
    socketService.getSocket()?.emit('join_room', { roomId: `${activeRoom.jobId}_${activeRoom.otherUserId}` });
  }, [activeRoom]);

  // Auto-scroll
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const sendMessage = useCallback(() => {
    if (!inputText.trim() || !activeRoom) return;
    const socket = socketService.getSocket();
    const roomId = `${activeRoom.jobId}_${activeRoom.otherUserId}`;
    const myId = user?._id || user?.id;
    const msg = { roomId, text: inputText.trim(), senderId: myId, senderName: user?.name, timestamp: new Date().toISOString(), _id: `temp_${Date.now()}`, isOwn: true };
    setMessages((prev) => [...prev, msg]);
    socket?.emit('send_message', { jobId: activeRoom.jobId, receiverId: activeRoom.otherUserId, text: msg.text });
    socket?.emit('typing_status', { roomId, userId: myId, isTyping: false });
    qc.invalidateQueries({ queryKey: ['conversations'] });
    setInputText('');
    clearTimeout(typingTimeout.current);
  }, [inputText, activeRoom, user, qc]);

  const handleInput = (e) => {
    setInputText(e.target.value);
    const socket = socketService.getSocket();
    const roomId = `${activeRoom?.jobId}_${activeRoom?.otherUserId}`;
    const myId = user?._id || user?.id;
    socket?.emit('typing_status', { roomId, userId: myId, isTyping: true });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => socket?.emit('typing_status', { roomId, userId: myId, isTyping: false }), 1500);
  };

  const filtered = conversations.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="h-[calc(100vh-40px)] m-4 md:m-8 bg-card border border-border rounded-2xl overflow-hidden flex shadow-2xl">
      {/* Sidebar */}
      <div className={`${activeRoom ? 'hidden md:flex' : 'flex'} w-full md:w-80 lg:w-96 bg-card flex flex-col border-r border-border flex-shrink-0`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button onClick={() => navigate(-1)} className="p-1.5 bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors" title="Back">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <button onClick={() => navigate('/')} className="p-1.5 bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors" title="Home">
                <Home className="w-4 h-4" />
              </button>
              <h2 className="text-xl font-bold text-foreground ml-1">Messages</h2>
            </div>
            {connected ? <Wifi className="w-4 h-4 text-emerald-500" /> : <WifiOff className="w-4 h-4 text-muted-foreground" />}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search..."
              className="w-full bg-background border border-border text-foreground rounded-lg py-2 pl-9 pr-4 text-sm focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {convoLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-12">No conversations yet.</p>
          ) : (
            filtered.map((c) => {
              const roomKey = `${c.jobId}_${c.otherUserId}`;
              const activeKey = activeRoom ? `${activeRoom.jobId}_${activeRoom.otherUserId}` : '';
              return (
                <div key={roomKey} onClick={() => setActiveRoom(c)}
                  className={`p-4 border-b border-border/50 cursor-pointer hover:bg-accent/50 transition-colors border-l-4 ${activeKey === roomKey ? 'bg-accent/30 border-l-primary' : 'border-l-transparent'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                      <img 
                        src={c.profilePic} 
                        alt={c.name}
                        className="w-9 h-9 rounded-full object-cover border border-border flex-shrink-0"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${c.name}`;
                        }}
                      />
                      <div>
                        <h4 className="font-semibold text-foreground text-sm">{c.name}</h4>
                        <p className="text-xs text-primary truncate">{c.jobTitle || 'Direct'}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-[10px] text-muted-foreground">{c.lastMessageTime}</span>
                      {c.unreadCount > 0 && <span className="bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5 rounded-full">{c.unreadCount}</span>}
                    </div>
                  </div>
                  <p className={`text-xs mt-1 truncate pl-11 ${c.unreadCount > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{c.lastMessage}</p>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      {activeRoom ? (
        <div className={`${activeRoom ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-background min-w-0`}>
          {/* Header */}
          <div className="p-4 border-b border-border flex justify-between items-center bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Mobile Back Button */}
              <button 
                onClick={() => setActiveRoom(null)} 
                className="p-1.5 md:hidden bg-muted hover:bg-accent rounded-lg text-muted-foreground transition-colors mr-1"
                title="Back to List"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <img 
                src={activeRoom.profilePic} 
                alt={activeRoom.name}
                className="w-10 h-10 rounded-full object-cover border border-border flex-shrink-0"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRoom.name}`;
                }}
              />
              <div>
                <h3 className="font-bold text-foreground text-sm">{activeRoom.name}</h3>
                <p className="text-xs">
                  {isTyping ? <span className="text-primary">typing...</span>
                    : connected ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1" /><span className="text-emerald-500">Online</span></>
                    : <span className="text-muted-foreground">Connecting...</span>}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <button className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors"><Phone className="w-4 h-4" /></button>
              <button className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors"><Video className="w-4 h-4" /></button>
              <div className="w-px h-5 bg-border mx-1" />
              <button className="p-1.5 rounded-lg hover:bg-accent hover:text-foreground transition-colors"><MoreVertical className="w-4 h-4" /></button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0
              ? <p className="text-center text-muted-foreground text-sm py-10">No messages yet. Say hello! 👋</p>
              : messages.map((msg) => {
                  const myId = user?._id || user?.id;
                  const isOwn = !!myId && (msg.senderId === myId || msg.sender === myId || msg.isOwn);
                  return (
                    <div key={msg._id} className={`flex gap-3 max-w-[78%] ${isOwn ? 'ml-auto flex-row-reverse' : ''}`}>
                      {!isOwn && (
                        <img 
                          src={activeRoom.profilePic} 
                          alt={msg.senderName || activeRoom.name}
                          className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.senderName || activeRoom.name || 'User'}`;
                          }}
                        />
                      )}
                      <div>
                        <div className={`p-3 rounded-2xl text-sm ${
                          isOwn 
                            ? user?.role?.toLowerCase() === 'client'
                              ? 'bg-indigo-600 text-white rounded-tr-none'
                              : 'bg-emerald-600 text-white rounded-tr-none'
                            : user?.role?.toLowerCase() === 'client'
                              ? 'bg-emerald-600/10 text-foreground border border-emerald-500/20 rounded-tl-none'
                              : 'bg-indigo-600/10 text-foreground border border-indigo-500/20 rounded-tl-none'
                        }`}>
                          {msg.text}
                        </div>
                        <span className={`text-[10px] text-muted-foreground mt-1 block ${isOwn ? 'text-right' : ''}`}>
                          {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                    </div>
                  );
                })
            }
            {isTyping && (
              <div className="flex gap-3 max-w-[78%]">
                <img 
                  src={activeRoom.profilePic} 
                  alt={activeRoom.name}
                  className="w-7 h-7 rounded-full object-cover border border-border flex-shrink-0"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${activeRoom.name}`;
                  }}
                />
                <div className="bg-card border border-border px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1">
                  {[0, 150, 300].map((d) => <span key={d} className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />)}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-card/50 backdrop-blur-sm flex-shrink-0">
            <div className="flex items-center gap-2">
              <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><Paperclip className="w-5 h-5" /></button>
              <button type="button" className="p-2 text-muted-foreground hover:text-foreground transition-colors"><ImageIcon className="w-5 h-5" /></button>
              <div className="flex-1 relative">
                <input type="text" value={inputText} onChange={handleInput}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                  placeholder="Type your message..."
                  className="w-full bg-background border border-border focus:border-primary text-foreground rounded-full py-2.5 pl-4 pr-12 text-sm focus:outline-none transition-colors" />
                <button onClick={sendMessage} disabled={!inputText.trim()}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-2 bg-primary hover:opacity-90 disabled:opacity-40 text-primary-foreground rounded-full transition-all">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center bg-background">
          <div className="text-center">
            <div className="w-16 h-16 bg-card border border-border rounded-2xl flex items-center justify-center mx-auto mb-4"><Send className="w-7 h-7 text-muted-foreground" /></div>
            <p className="text-muted-foreground font-medium">Select a conversation</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Messages;