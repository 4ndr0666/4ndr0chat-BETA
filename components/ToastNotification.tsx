import React from 'react';
import { SessionsIcon, TrashIcon, DistillIcon } from './IconComponents';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'cleared' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) {
    return null;
  }

  const ICONS = {
    success: SessionsIcon,
    cleared: TrashIcon,
    info: DistillIcon
  }

  const typeClasses = type;
  const Icon = ICONS[type] || SessionsIcon;

  return (
    <div className={`toast-notification ${typeClasses}`}>
      <Icon />
      <span>{message}</span>
    </div>
  );
};

export default ToastNotification;