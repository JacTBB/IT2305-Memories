'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryStreamedHydration } from '@tanstack/react-query-next-experimental';
import React, { useState } from 'react';

import { TooltipProvider } from '@/components/ui/tooltip';

function Provider({ children }: any) {
  const [client] = useState(new QueryClient());

  return (
    <>
      <QueryClientProvider client={client}>
        <ReactQueryStreamedHydration>
          <TooltipProvider>{children}</TooltipProvider>
        </ReactQueryStreamedHydration>
      </QueryClientProvider>
    </>
  );
}

export { Provider };
