import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAcceptInvitation } from '@/hooks/mutations';
import { callGetInvitationDetails } from '@/lib/firebase';
import type { InvitationDetails } from '@supermarket-list/shared';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { StatusCard } from '@/components/ui/status-card';
import { Loader2, Home, AlertCircle, CheckCircle2 } from 'lucide-react';

export function JoinHouseholdPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuthContext();
  const acceptMutation = useAcceptInvitation();

  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);
  const [detailsError, setDetailsError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !user) return;

    async function fetchDetails() {
      try {
        const result = await callGetInvitationDetails({ token: token! });
        setDetails(result.data);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Invitation not found';
        setDetailsError(message);
      } finally {
        setLoadingDetails(false);
      }
    }

    fetchDetails();
  }, [token, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <StatusCard
          title="Sign in Required"
          description="You need to sign in before joining a household."
        >
          <Button className="w-full" onClick={() => navigate('/login', { state: { from: location.pathname } })}>
            Go to Sign In
          </Button>
        </StatusCard>
      </div>
    );
  }

  const handleAccept = async () => {
    if (!token) return;
    try {
      await acceptMutation.mutateAsync(token);
      navigate('/');
    } catch {
      // Error handled by mutation
    }
  };

  const isInvalid = details?.isExpired || details?.isFull || details?.status !== 'active';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      {loadingDetails ? (
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </CardContent>
        </Card>
      ) : detailsError ? (
        <StatusCard
          icon={<AlertCircle className="h-12 w-12 text-destructive" />}
          title="Invalid Invitation"
          description={detailsError}
        >
          <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </StatusCard>
      ) : isInvalid ? (
        <StatusCard
          icon={<AlertCircle className="h-12 w-12 text-muted-foreground" />}
          title="Invitation Unavailable"
          description={
            details?.isExpired
              ? 'This invitation has expired.'
              : details?.isFull
                ? 'This invitation has already been used.'
                : 'This invitation is no longer valid.'
          }
        >
          <Button className="w-full" variant="outline" onClick={() => navigate('/')}>
            Go Home
          </Button>
        </StatusCard>
      ) : acceptMutation.isSuccess ? (
        <StatusCard
          icon={<CheckCircle2 className="h-12 w-12 text-primary" />}
          title="Joined Successfully!"
          description={<>You are now a member of {details?.householdName}.</>}
        >
          <Button className="w-full" onClick={() => navigate('/')}>
            Go to Shopping List
          </Button>
        </StatusCard>
      ) : (
        <StatusCard
          icon={<Home className="h-12 w-12 text-primary" />}
          title="You're Invited!"
          description={
            <>
              Join <span className="font-semibold">{details?.householdName}</span> to start
              collaborating on shopping lists.
            </>
          }
          contentClassName="space-y-3"
        >
          <Button
            className="w-full"
            size="lg"
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
          >
            {acceptMutation.isPending && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            Join Household
          </Button>
          {acceptMutation.isError && (
            <p className="text-sm text-destructive text-center">
              {acceptMutation.error?.message || 'Failed to join'}
            </p>
          )}
          <Button
            className="w-full"
            variant="ghost"
            onClick={() => navigate('/')}
          >
            Cancel
          </Button>
        </StatusCard>
      )}
    </div>
  );
}
