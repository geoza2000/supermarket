import { useState } from 'react';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { callSendTestNotification } from '@/lib/firebase';
import { Bell, Loader2 } from 'lucide-react';

export function DashboardPage() {
  const { user, signOut } = useAuthContext();
  const [isSending, setIsSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const handleSendTestNotification = async () => {
    setIsSending(true);
    setTestResult(null);
    try {
      const result = await callSendTestNotification({});
      if (result.data.success) {
        setTestResult(`Sent to ${result.data.successCount}/${result.data.totalTokens} devices`);
      } else {
        setTestResult('No tokens registered for notifications');
      }
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setTestResult('Failed to send notification');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <h1 className="text-4xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-8">Welcome, {user?.displayName || 'User'}</p>
      <div className="flex flex-col gap-3">
        <Button onClick={handleSendTestNotification} disabled={isSending}>
          {isSending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Bell className="mr-2 h-4 w-4" />
          )}
          Send Test Notification
        </Button>
        {testResult && (
          <p className="text-sm text-center text-muted-foreground">{testResult}</p>
        )}
        <Button onClick={signOut} variant="outline">
          Sign Out
        </Button>
      </div>
    </div>
  );
}
