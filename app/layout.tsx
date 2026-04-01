'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/app/components/ui/toaster';
import { Toaster as Sonner } from '@/app/components/ui/sonner';
import { TooltipProvider } from '@/app/components/ui/tooltip';
import "./globals.css";
import { useState } from 'react';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  }));

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Certificate Generator</title>
        <meta name="description" content="Upload image templates, add text boxes, manage members, and generate certificates in bulk" />
        <link
          rel="preload"
          href="/font/Basic.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="antialiased">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            {children}
            <Toaster />
            <Sonner />
          </TooltipProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
