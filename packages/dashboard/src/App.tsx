import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { LoginPage } from '@/pages/LoginPage';
import { ShoppingListPage } from '@/pages/ShoppingListPage';
import { ShopsPage } from '@/pages/ShopsPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { HouseholdSelectPage } from '@/pages/HouseholdSelectPage';
import { CreateHouseholdPage } from '@/pages/CreateHouseholdPage';
import { JoinHouseholdPage } from '@/pages/JoinHouseholdPage';
import { HouseholdSettingsPage } from '@/pages/HouseholdSettingsPage';
import { Toaster } from '@/components/ui/toaster';
import { FcmTokenSync, NotificationListener, NotificationPrompt } from '@/components/notifications';
import { ProtectedRoute, HouseholdGuard } from '@/components/guards';
import { OfflineBanner } from '@/components/OfflineBanner';

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/join/:token" element={<JoinHouseholdPage />} />
      <Route
        path="/household/select"
        element={
          <ProtectedRoute>
            <HouseholdSelectPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/household/new"
        element={
          <ProtectedRoute>
            <CreateHouseholdPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/household/settings"
        element={
          <ProtectedRoute>
            <HouseholdGuard>
              <HouseholdSettingsPage />
            </HouseholdGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/products"
        element={
          <ProtectedRoute>
            <HouseholdGuard>
              <ProductsPage />
            </HouseholdGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/shops"
        element={
          <ProtectedRoute>
            <HouseholdGuard>
              <ShopsPage />
            </HouseholdGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <HouseholdGuard>
              <ShoppingListPage />
            </HouseholdGuard>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function AuthenticatedFcmComponents() {
  const { user } = useAuthContext();
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
        <OfflineBanner />
        <AppRoutes />
        <Toaster />
        <NotificationPrompt />
        <AuthenticatedFcmComponents />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
