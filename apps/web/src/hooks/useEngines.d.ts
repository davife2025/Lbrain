export interface Notification {
    id: string;
    type: 'alert' | 'agent';
    title: string;
    message: string;
    success: boolean;
    timestamp: string;
    read: boolean;
}
export declare function useEngines(): {
    notifications: Notification[];
    unreadCount: number;
    markAllRead: () => void;
    clearNotifications: () => void;
};
//# sourceMappingURL=useEngines.d.ts.map