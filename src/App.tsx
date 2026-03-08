import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { FavoritesProvider, useFavoritesContext } from "@/contexts/FavoritesContext";
import { PlayerProvider } from "@/contexts/PlayerContext";
import { StreamBufferProvider } from "@/contexts/StreamBufferContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Wrapper that bridges FavoritesContext → PlayerProvider.onStationPlay */
function CoreProviders({ children }: { children: React.ReactNode }) {
  const { addRecent } = useFavoritesContext();

  return (
    <PlayerProvider onStationPlay={addRecent}>
      <StreamBufferProvider>
        {children}
      </StreamBufferProvider>
    </PlayerProvider>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <LanguageProvider>
        <FavoritesProvider>
          <CoreProviders>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </CoreProviders>
        </FavoritesProvider>
      </LanguageProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
