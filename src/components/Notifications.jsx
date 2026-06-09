import React, { useState, useRef, useEffect } from 'react';
import { Bell, CheckCircle, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../api/endpoints';

const useNotifications = () => {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationsApi.getAll().then((r) => r.data),
    refetchInterval: 30000,
  });

  const markAll = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markOne = useMutation({
    mutationFn: notificationsApi.markOneRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    markAllRead: () => markAll.mutate(),
    markOneRead: (id) => markOne.mutate(id),
  };
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
};

const Notifications = () => {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef(null);
  const { notifications, unreadCount, isLoading, markAllRead, markOneRead } = useNotifications();

  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  return (
    <div className="relative" ref={panelRef}>
      <button onClick={() => setIsOpen((p) => !p)}
        className="relative p-2 text-gray-400 hover:text-white transition-colors" aria-label="Notifications">
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-gray-900" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-50">
          <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900/50">
            <h3 className="font-bold text-white flex items-center gap-2">
              Notifications
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center items-center p-8">
                <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                You're all caught up!
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id || n.id}
                  onClick={() => { if (!n.read) markOneRead(n._id || n.id); }}
                  className={`p-4 border-b border-gray-700/50 cursor-pointer hover:bg-gray-700/50 transition-colors ${!n.read ? 'bg-indigo-500/5' : ''}`}>
                  <p className={`text-sm ${!n.read ? 'text-white font-medium' : 'text-gray-400'}`}>
                    {n.message || n.text}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{formatDate(n.createdAt) || n.time || ''}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;