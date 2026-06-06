import type { Notification } from '@/hooks/useEngines';
interface Props {
    notifications: Notification[];
    unreadCount: number;
    onMarkRead: () => void;
    onClear: () => void;
}
export default function NotificationBell({ notifications, unreadCount, onMarkRead, onClear }: Props): import("react").JSX.Element;
export {};
//# sourceMappingURL=NotificationBell.d.ts.map