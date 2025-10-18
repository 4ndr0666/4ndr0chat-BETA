import React from 'react';
// Fix: Replaced non-existent SaveIcon with the existing CheckIcon.
import { CheckIcon, TrashIcon, DistillIcon } from './IconComponents';

interface ToastNotificationProps {
  message: string | null;
  type?: 'success' | 'cleared' | 'info';
}

const ToastNotification: React.FC<ToastNotificationProps> = ({ message, type = 'success' }) => {
  if (!message) {
    return null;
  }

  const ICONS = {
    // Fix: Use CheckIcon for success toasts.
    success: CheckIcon,
    cleared: TrashIcon,
    info: DistillIcon
  }

  const typeClasses = type;
  // Fix: Use CheckIcon as the default icon.
  const Icon = ICONS[type] || CheckIcon;

  return (
    <div className={`toast-notification ${typeClasses}`}>
      <Icon />
      <span>{message}</span>
    </div>
  );
};

export default ToastNotification;