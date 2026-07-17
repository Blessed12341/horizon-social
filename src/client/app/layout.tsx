'use client';

import React from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { RealtimeProvider } from '@/contexts/RealtimeContext';
import { useAuth } from '@/contexts/AuthContext';
import '../styles/globals.css';

function RootLayoutContent({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

  return (
    <RealtimeProvider userId={user?.id}>
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Horizon Social</title>
          <meta name="description" content="Connect with the world on Horizon Social" />
        </head>
        <body>
          {children}
        </body>
      </html>
    </RealtimeProvider>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RootLayoutContent>{children}</RootLayoutContent>
    </AuthProvider>
  );
}
