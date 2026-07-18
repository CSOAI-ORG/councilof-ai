import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import EquipmentHire from "./pages/EquipmentHire";
import ServicesPage from "./pages/ServicesPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import PlantHire from "./pages/services/PlantHire";
import Demolition from "./pages/services/Demolition";
import AsbestosRemoval from "./pages/services/AsbestosRemoval";
import OperatedHire from "./pages/services/OperatedHire";
import Groundworks from "./pages/services/Groundworks";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/equipment-hire" element={<EquipmentHire />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/services/plant-hire" element={<PlantHire />} />
          <Route path="/services/demolition" element={<Demolition />} />
          <Route path="/services/asbestos-removal" element={<AsbestosRemoval />} />
          <Route path="/services/operated-hire" element={<OperatedHire />} />
          <Route path="/services/groundworks" element={<Groundworks />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
