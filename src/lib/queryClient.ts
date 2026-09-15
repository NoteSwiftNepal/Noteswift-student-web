import { QueryClient } from "@tanstack/react-query";

// Plain @tanstack/react-query client — no singleton-injection wrapper.
// Mobile's lib/queryClient.ts reimplements useQuery/useMutation to work
// around a React Native/Metro context-isolation bug; that bug doesn't exist
// in Next.js, so we use QueryClientProvider + the library's hooks directly
// (blueprint §9).
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      retry: 1,
    },
  },
});

export { QueryClientProvider } from "@tanstack/react-query";
