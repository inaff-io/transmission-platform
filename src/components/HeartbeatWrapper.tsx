'use client';

import { useHeartbeat } from '@/hooks/useHeartbeat';

export default function HeartbeatWrapper({
  children
}: {
  children: React.ReactNode;
}) {
  // Inicializa o heartbeat
  useHeartbeat();

  return <>{children}</>;
}
