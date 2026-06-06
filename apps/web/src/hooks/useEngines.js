'use client';
/**
 * apps/web/src/hooks/useEngines.ts
 * React hook that starts alert + agent engines on mount.
 * Drop into _app or a layout component.
 */
import { useEffect, useState } from 'react';
import { alertEngine } from '@/lib/alertEngine';
import { agentEngine } from '@/lib/agentEngine';
import { useStore } from '@/lib/store';
export function useEngines() {
    const { apiKey, apiSecret, autoTradeEnabled } = useStore();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    useEffect(() => {
        // Configure agent engine with credentials
        agentEngine.configure(apiKey, apiSecret, autoTradeEnabled);
        // Request notification permission
        alertEngine.requestPermission();
        // Start engines
        alertEngine.start(30000); // check alerts every 30s
        agentEngine.start(60000); // check rules every 60s
        // Listen for alert triggers
        const unsubAlert = alertEngine.onTrigger((alert, price) => {
            const notif = {
                id: crypto.randomUUID(),
                type: 'alert',
                title: `Price Alert — ${alert.symbol}`,
                message: `${alert.symbol} hit ${alert.condition} $${alert.target.toLocaleString()} · Current: $${price.toLocaleString()}`,
                success: true,
                timestamp: new Date().toISOString(),
                read: false,
            };
            setNotifications(n => [notif, ...n].slice(0, 50));
            setUnreadCount(c => c + 1);
        });
        // Listen for agent logs
        const unsubAgent = agentEngine.onLog((log) => {
            const notif = {
                id: crypto.randomUUID(),
                type: 'agent',
                title: `Agent: ${log.ruleName}`,
                message: log.result,
                success: log.success,
                timestamp: log.timestamp,
                read: false,
            };
            setNotifications(n => [notif, ...n].slice(0, 50));
            setUnreadCount(c => c + 1);
        });
        return () => {
            alertEngine.stop();
            agentEngine.stop();
            unsubAlert();
            unsubAgent();
        };
    }, [apiKey, apiSecret, autoTradeEnabled]);
    function markAllRead() {
        setNotifications(n => n.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
    }
    function clearNotifications() {
        setNotifications([]);
        setUnreadCount(0);
    }
    return { notifications, unreadCount, markAllRead, clearNotifications };
}
//# sourceMappingURL=useEngines.js.map