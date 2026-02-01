import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter: React.FC = () => {
    const { notifications, unreadCount, markAsRead, isConnected } = useNotification();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const navigate = useNavigate();

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification: any) => {
        console.log('Notification clicked:', notification);
        console.log('Action URL:', notification.actionUrl);
        
        // Mark as read
        if (!notification.isRead) {
            markAsRead(notification.id);
        }
        
        // Navigate to action URL if available
        if (notification.actionUrl) {
            setIsOpen(false); // Close dropdown
            console.log('Navigating to:', notification.actionUrl);
            navigate(notification.actionUrl);
        } else {
            console.warn('No actionUrl found in notification');
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 hover:text-primary dark:text-gray-300 dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none"
            >
                <span className="sr-only">View notifications</span>
                {/* Bell Icon */}
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>

                {/* Badge */}
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse"></span>
                )}

                {/* Status Dot (Connected/Disconnected) */}
                <span className={`absolute bottom-2 right-1 h-1.5 w-1.5 rounded-full ring-1 ring-white ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`}></span>
            </button>

            {/* Dropdown Panel */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 rounded-full">
                                {unreadCount} new
                            </span>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                                {notifications.map((notification) => (
                                    <li
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <div className="flex items-start">
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                                    {notification.title}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {(() => {
                                                        try {
                                                            // Ensure UTC timestamp is treated correctly
                                                            const date = new Date(notification.createdAt);
                                                            // Verify explicitly if it's parsed as UTC or needs forcing
                                                            return formatDistanceToNow(date, { addSuffix: true });
                                                        } catch (e) {
                                                            return 'Recently';
                                                        }
                                                    })()}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <div className="ml-3 flex-shrink-0">
                                                    <span className="h-2 w-2 rounded-full bg-primary block"></span>
                                                </div>
                                            )}
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 text-center">
                        <button className="text-xs text-primary font-medium hover:text-primary-hover">
                            View all notifications
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
