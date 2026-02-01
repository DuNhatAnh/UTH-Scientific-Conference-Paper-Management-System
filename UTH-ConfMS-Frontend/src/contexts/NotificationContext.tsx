import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as signalR from '@microsoft/signalr';
import { useAuth } from './AuthContext';
import apiClient from '../services/apiClient';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: Date;
    actionUrl?: string;
    relatedEntityId?: string;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    isConnected: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    fetchNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Hook to use the context
export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};

interface NotificationProviderProps {
    children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
    const { user, isAuthenticated } = useAuth();
    const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isConnected, setIsConnected] = useState(false);

    // Initialize SignalR connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!isAuthenticated || !token) {
            return;
        }

        // Determine the Hub URL - Connect directly to notification service to avoid gateway WebSocket issues
        const HUB_URL = 'http://localhost:5005/hubs/notifications';

        const newConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .configureLogging(signalR.LogLevel.Information)
            .build();

        setConnection(newConnection);
    }, [isAuthenticated]);

    // Fetch initial notifications via API
    useEffect(() => {
        if (isAuthenticated) {
            fetchNotifications();
            fetchUnreadCount();
        }
    }, [isAuthenticated]);

    const fetchNotifications = async () => {
        try {
            const response = await apiClient.get('/api/notifications?page=1&pageSize=20');
            const mappedNotifications = response.data.map((n: any) => ({
                ...n,
                createdAt: new Date(n.createdAt),
                // Map backend properties to frontend interface if needed
                id: n.notificationId || n.id // Ensure ID mapping is correct based on DTO
            }));
            setNotifications(mappedNotifications);
        } catch (error) {
            console.error('Failed to fetch notifications', error);
        }
    };

    const fetchUnreadCount = async () => {
        try {
            const response = await apiClient.get('/api/notifications/unread-count');
            setUnreadCount(response.data.count);
        } catch (error) {
            console.error('Failed to fetch unread count', error);
        }
    };

    // Start connection and set up listeners
    useEffect(() => {
        if (!connection) return;

        const startConnection = async () => {
            try {
                await connection.start();
                console.log('SignalR Connected!');
                setIsConnected(true);

                // Listen for incoming notifications
                connection.on('ReceiveNotification', (notification: any) => {
                    console.log('Notification received:', notification);
                    const newNotification: Notification = {
                        ...notification,
                        createdAt: new Date(notification.createdAt)
                    };

                    setNotifications(prev => [newNotification, ...prev]);
                    setUnreadCount(prev => prev + 1);
                });

            } catch (err) {
                console.error('SignalR Connection Error: ', err);
                setIsConnected(false);
            }
        };

        startConnection();

        return () => {
            connection.stop();
            setIsConnected(false);
        };
    }, [connection]);

    const markAsRead = async (id: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));

        try {
            await apiClient.put(`/api/notifications/${id}/read`);
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        // Optimistic
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
        // Implement backend bulk mark-read if available
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            isConnected,
            markAsRead,
            markAllAsRead,
            fetchNotifications
        }}>
            {children}
        </NotificationContext.Provider>
    );
};
