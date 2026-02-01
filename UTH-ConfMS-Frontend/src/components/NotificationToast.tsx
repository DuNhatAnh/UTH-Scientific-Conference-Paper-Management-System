import React, { useEffect, useState } from 'react';
import { useNotification } from '../contexts/NotificationContext';

export const NotificationToast: React.FC = () => {
    const { notifications, markAsRead } = useNotification();
    const [visible, setVisible] = useState(false);
    const [currentNotification, setCurrentNotification] = useState<any>(null);

    useEffect(() => {
        // Show the latest unread notification
        const latest = notifications[0];
        if (latest && !latest.isRead) {
            setCurrentNotification(latest);
            setVisible(true);

            // Auto hide after 5 seconds
            const timer = setTimeout(() => {
                setVisible(false);
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [notifications]);

    if (!visible || !currentNotification) return null;

    return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden">
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        {/* Icon based on type */}
                        <svg className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                            {currentNotification.title}
                        </p>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {currentNotification.message}
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            className="bg-transparent rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            onClick={() => {
                                setVisible(false);
                                markAsRead(currentNotification.id);
                            }}
                        >
                            <span className="sr-only">Close</span>
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
