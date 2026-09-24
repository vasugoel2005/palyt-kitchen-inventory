import React from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

export interface NotificationMessage {
  id: string;
  type: 'success' | 'warning' | 'info';
  title: string;
  details?: string[];
}

interface NotificationBannerProps {
  notification: NotificationMessage | null;
  onDismiss: () => void;
}

export const NotificationBanner: React.FC<NotificationBannerProps> = ({
  notification,
  onDismiss,
}) => {
  if (!notification) return null;

  return (
    <div className={`notification-banner banner-${notification.type}`} role="alert">
      <div className="banner-icon">
        {notification.type === 'success' ? (
          <CheckCircle2 size={20} />
        ) : (
          <AlertTriangle size={20} />
        )}
      </div>
      <div className="banner-content">
        <strong className="banner-title">{notification.title}</strong>
        {notification.details && notification.details.length > 0 && (
          <ul className="banner-details-list">
            {notification.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
        )}
      </div>
      <button className="banner-close" onClick={onDismiss} aria-label="Dismiss notification">
        <X size={16} />
      </button>
    </div>
  );
};
