import React, { useEffect } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const Toast = ({ type, message, onClose, duration = 3000 }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircleIcon className="h-5 w-5 text-green-500" />,
    error: <XCircleIcon className="h-5 w-5 text-red-500" />,
    info: <InformationCircleIcon className="h-5 w-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200'
  };

  return (
    <div className={`${bgColors[type]} border rounded-xl shadow-lg p-4 min-w-[300px] animate-slide-up`}>
      <div className="flex items-start gap-3">
        {icons[type]}
        <p className="flex-1 text-sm text-gray-700">{message}</p>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default Toast;