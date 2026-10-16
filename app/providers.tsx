'use client';

import { TooltipProvider } from '@/app/components/ui/tooltip';
import { Toaster as Sonner } from '@/app/components/ui/sonner';
import { CertificateProvider } from '@/app/context/CertificateContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CertificateProvider>
      <TooltipProvider>
        {children}
        <Sonner />
      </TooltipProvider>
    </CertificateProvider>
  );
}
