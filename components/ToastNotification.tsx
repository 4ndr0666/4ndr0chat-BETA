import React from 'react';
import { SaveIcon, MemoryWipeIcon, DistillIcon } from './IconComponents';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'cleared' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) {
    return null;
  }

  const ICONS = {
    success: SaveIcon,
    cleared: MemoryWipeIcon,
    info: DistillIcon
  }

  const typeClasses = type;
  const Icon = ICONS[type] || SaveIcon;

  return (
    <div className={`toast-notification ${typeClasses}`}>
      <Icon />
      <span>{message}</span>
    </div>
  );
};

export default ToastNotification;