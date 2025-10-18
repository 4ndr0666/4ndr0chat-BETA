import React from 'react';
// Fix: Replaced non-existent SessionsIcon with SaveIcon.
import { SaveIcon, TrashIcon, DistillIcon } from './IconComponents';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'cleared' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) {
    return null;
  }

  const ICONS = {
    // Fix: Use SaveIcon for success toasts.
    success: SaveIcon,
    cleared: TrashIcon,
    info: DistillIcon
  }

  const typeClasses = type;
  // Fix: Use SaveIcon as the default icon.
  const Icon = ICONS[type] || SaveIcon;

  return (
    <div className={`toast-notification ${typeClasses}`}>
      <Icon />
      <span>{message}</span>
    </div>
  );
};

export default ToastNotification;