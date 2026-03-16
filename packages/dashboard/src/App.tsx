import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { Loader2 } from 'lucide-react';
import { Toaster } from '@/components/ui/toaster';
import { FcmTokenSync, NotificationListener, NotificationPrompt } from '@/components/notifications';

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthContext();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

// Notification and FCM components wrapper - only active when user is logged in
function AuthenticatedFcmComponents() {
  const { user } = useAuthContext();
  
  // Only active when user is logged in
  if (!user) return null;
  
  return (
    <>
      <NotificationListener />
      <FcmTokenSync />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
        <NotificationPrompt />
        <AuthenticatedFcmComponents />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
