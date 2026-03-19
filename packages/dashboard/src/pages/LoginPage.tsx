import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';

export function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = (location.state as { from?: string })?.from || '/';

  useEffect(() => {
    if (!loading && user) {
      navigate(returnTo);
    }
  }, [user, loading, navigate, returnTo]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Supermarket List</h1>
        <p className="text-muted-foreground">Sign in to continue</p>
        <Button onClick={signInWithGoogle} size="lg">
          Sign in with Google
        </Button>
      </div>
    </div>
  );
}
