import React from 'react';
import { SaveIcon, MemoryWipeIcon } from './IconComponents';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'cleared';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) {
    return null;
  }

  const typeClasses = type === 'success' ? 'success' : 'cleared';
  const Icon = type === 'success' ? SaveIcon : MemoryWipeIcon;

  return (
    <div className={`toast-notification ${typeClasses}`}>
      <Icon />
      <span>{message}</span>
    </div>
  );
};

export default ToastNotification;