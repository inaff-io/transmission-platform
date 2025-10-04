'use client';

import HeartbeatWrapper from '@/components/HeartbeatWrapper';
import { UserProvider } from '@/contexts/UserContext';

export default function ProtectedLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <HeartbeatWrapper>
        {children}
      </HeartbeatWrapper>
    </UserProvider>
  );
}
