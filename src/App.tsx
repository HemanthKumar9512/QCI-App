import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useEffect } from "react";
import { useQCIStore } from "@/store/qciStore";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import QuantumParticles from "@/components/shared/QuantumParticles";
import Dashboard from "@/pages/Dashboard";
import Customers from "@/pages/Customers";
import CustomerDetail from "@/pages/CustomerDetail";
import QuantumPage from "@/pages/QuantumPage";
import BlockchainPage from "@/pages/BlockchainPage";
import RetentionPage from "@/pages/RetentionPage";
import PricingPage from "@/pages/PricingPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppContent() {
  const initialize = useQCIStore(s => s.initialize);
  const updateRandomCustomers = useQCIStore(s => s.updateRandomCustomers);
  const addLog = useQCIStore(s => s.addLog);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Real-time simulation
  useEffect(() => {
    const interval = setInterval(() => {
      updateRandomCustomers();
    }, 3000);
    const logInterval = setInterval(() => {
      const modules = ['Quantum', 'Vedic', 'Fibonacci', 'Mayan', 'Sentiment', 'RL', 'Blockchain'];
      const messages = [
        'Processing feature vectors...', 'VQC gate rotation applied',
        'Spiral clustering updated', 'Cycle autocorrelation computed',
        'Sentiment score recalculated', 'Policy gradient step complete',
        'Transaction committed to chain', 'Node sync complete',
        'Differential privacy noise added', 'Model weights aggregated',
      ];
      addLog('INFO', modules[Math.floor(Math.random() * modules.length)], messages[Math.floor(Math.random() * messages.length)]);
    }, 2000);
    return () => { clearInterval(interval); clearInterval(logInterval); };
  }, [updateRandomCustomers, addLog]);

  return (
    <>
      <QuantumParticles />
      <Sidebar />
      <TopBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/customers/:id" element={<CustomerDetail />} />
        <Route path="/quantum" element={<QuantumPage />} />
        <Route path="/blockchain" element={<BlockchainPage />} />
        <Route path="/retention" element={<RetentionPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
