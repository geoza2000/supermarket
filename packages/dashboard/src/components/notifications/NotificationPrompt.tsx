import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { isPWAInstalled } from '@/lib/pwa';
import { useAuthContext } from '@/contexts/AuthContext';
import { usePushNotificationSettings } from '@/hooks/usePushNotificationSettings';

const STORAGE_KEY = 'notification-prompt-dismissed';
const DISMISS_DURATION_DAYS = 7; // Re-prompt after 7 days

/**
 * Component that prompts for notification permission when running as PWA.
 * Shows a minimal banner - clicking "Enable" triggers the native browser popup.
 */
export function NotificationPrompt() {
  const { user } = useAuthContext();
  const { browserPermission, isEnabled, enable, isLoading } = usePushNotificationSettings({ 
    userId: user?.uid || null 
  });
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Must be running as PWA
    if (!isPWAInstalled()) {
      setShowPrompt(false);
      return;
    }

    // Must be logged in
    if (!user) {
      setShowPrompt(false);
      return;
    }

    // Don't show if notifications are already granted/enabled
    if (browserPermission === 'granted' || isEnabled) {
      setShowPrompt(false);
      return;
    }

    // Don't show if notifications are permanently blocked
    if (browserPermission === 'denied') {
      setShowPrompt(false);
      return;
    }

    // Check if user dismissed recently
    const dismissedAt = localStorage.getItem(STORAGE_KEY);
    if (dismissedAt) {
      const dismissDate = new Date(dismissedAt);
      const daysSinceDismiss = (Date.now() - dismissDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceDismiss < DISMISS_DURATION_DAYS) {
        setShowPrompt(false);
        return;
      }
    }

    // Small delay before showing
    const timer = setTimeout(() => {
      setShowPrompt(true);
    }, 1500);

    return () => clearTimeout(timer);
  }, [user, browserPermission, isEnabled]);

  const handleEnable = async () => {
    await enable();
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  };

  if (!showPrompt) return null;

  return (
    <div 
      className="fixed left-4 right-4 md:left-auto md:right-4 md:w-80 z-50 animate-in slide-in-from-bottom-4"
      style={{ bottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="border border-primary/20 shadow-lg rounded-lg bg-background">
        <div className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary flex-shrink-0">
              <Bell className="h-4 w-4 text-primary-foreground" />
            </div>
            <p className="text-sm flex-1">
              Enable notifications to stay updated?
            </p>
            <div className="flex items-center gap-1 flex-shrink-0">
              <Button 
                size="sm" 
                onClick={handleEnable}
                disabled={isLoading}
                className="h-8 px-3"
              >
                {isLoading ? '...' : 'Enable'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
