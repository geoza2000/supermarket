import { useEffect, useState, useCallback } from 'react';
import { onForegroundMessage } from '@/lib/firebase';
import { Bell, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface NotificationPayload {
  notification?: {
    title?: string;
    body?: string;
  };
  data?: {
    type?: string;
    notificationId?: string;
    deepLink?: string;
    [key: string]: string | undefined;
  };
}

interface NotificationDialogData {
  title: string;
  body: string;
  deepLink?: string;
}

/**
 * Component that listens for foreground FCM messages and displays them as a dialog
 * Must be mounted within a Router context
 */
export function NotificationListener() {
  const [notification, setNotification] = useState<NotificationDialogData | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('NotificationListener: Setting up foreground message listener');
    
    const unsubscribe = onForegroundMessage((payload: unknown) => {
      const typedPayload = payload as NotificationPayload;
      console.log('NotificationListener: Received foreground message:', typedPayload);

      const title = typedPayload.notification?.title || typedPayload.data?.type || 'New Notification';
      const body = typedPayload.notification?.body || 'You have a new notification';
      const deepLink = typedPayload.data?.deepLink;

      setNotification({ title, body, deepLink });
      setIsVisible(true);

      // Also show a native notification if permission is granted
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/logo-192.png',
            tag: typedPayload.data?.notificationId || 'foreground',
          });
        } catch (e) {
          // Native notifications might not work in all contexts
          console.log('Could not show native notification:', e);
        }
      }
    });

    return () => {
      console.log('NotificationListener: Cleaning up foreground message listener');
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleClose = useCallback(() => {
    setIsVisible(false);
    // Clear notification after animation
    setTimeout(() => setNotification(null), 300);
  }, []);

  const handleViewClick = useCallback(() => {
    if (notification?.deepLink) {
      navigate(notification.deepLink);
    }
    handleClose();
  }, [notification, navigate, handleClose]);

  if (!notification) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 z-50 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={handleClose}
      />
      
      {/* Dialog */}
      <div 
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md transition-all duration-300 ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
      >
        <div className="bg-background border rounded-lg shadow-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary/5">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-primary/10">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <h2 className="font-semibold text-lg">{notification.title}</h2>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          {/* Body */}
          <div className="p-4">
            <p className="text-muted-foreground">{notification.body}</p>
          </div>
          
          {/* Footer */}
          <div className="flex gap-2 p-4 border-t bg-muted/30">
            <Button variant="outline" className="flex-1" onClick={handleClose}>
              Dismiss
            </Button>
            {notification.deepLink && (
              <Button className="flex-1" onClick={handleViewClick}>
                View
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
