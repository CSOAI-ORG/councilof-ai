import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import MobileEnhancements from "./components/MobileEnhancements";
import MobileContactButtons from "./components/MobileContactButtons";
import BackToTop from "./components/BackToTop";
import EnhancedIndex from "./pages/EnhancedIndex";
import Index from "./pages/Index";
import About from "./pages/About";
import Services from "./pages/Services";
import MuckAway from "./pages/services/MuckAway";
import GrabHire from "./pages/services/GrabHire";
import Aggregates from "./pages/services/Aggregates";
import Utilities from "./pages/services/Utilities";
import TipperHire from "./pages/services/TipperHire";
import Locations from "./pages/Locations";
import Contact from "./pages/Contact";
import Quote from "./pages/Quote";
import FAQ from "./pages/FAQ";
import Blog from "./pages/Blog";
import NotFound from "./pages/NotFound";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";

// Blog Articles
import GrabVsSkipHire from "./pages/blog/GrabVsSkipHire";
import GrabLorrySize from "./pages/blog/GrabLorrySize";
import EnvironmentalBenefits from "./pages/blog/EnvironmentalBenefits";
import ConstructionWasteManagement from "./pages/blog/ConstructionWasteManagement";
import GardenClearance from "./pages/blog/GardenClearance";
import WasteRegulations from "./pages/blog/WasteRegulations";
import SkipHireAlternative from "./pages/services/SkipHireAlternative";
import ConstructionWaste from "./pages/services/ConstructionWaste";
import GardenWaste from "./pages/services/GardenWaste";
import CommercialWaste from "./pages/services/CommercialWaste";
import EmergencyWaste from "./pages/services/EmergencyWaste";
import SoilDisposal from "./pages/services/SoilDisposal";
import WasteRemoval from "./pages/services/WasteRemoval";
import Kent from "./pages/locations/Kent";
import London from "./pages/locations/London";
import Essex from "./pages/locations/Essex";
import Equipment from "./pages/Equipment";
import Pricing from "./pages/Pricing";
import Industries from "./pages/Industries";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <MobileEnhancements />
        <MobileContactButtons />
        <BackToTop />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/muck-away" element={<MuckAway />} />
          <Route path="/services/grab-hire" element={<GrabHire />} />
          <Route path="/services/aggregates" element={<Aggregates />} />
          <Route path="/services/utilities" element={<Utilities />} />
          <Route path="/services/tipper-hire" element={<TipperHire />} />
          <Route path="/services/skip-hire-alternative" element={<SkipHireAlternative />} />
          <Route path="/services/construction-waste" element={<ConstructionWaste />} />
          <Route path="/services/garden-waste" element={<GardenWaste />} />
          <Route path="/services/commercial-waste" element={<CommercialWaste />} />
          <Route path="/services/emergency-waste" element={<EmergencyWaste />} />
          <Route path="/services/soil-disposal" element={<SoilDisposal />} />
          <Route path="/services/waste-removal" element={<WasteRemoval />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/locations/kent" element={<Kent />} />
          <Route path="/locations/london" element={<London />} />
          <Route path="/locations/essex" element={<Essex />} />
          <Route path="/equipment" element={<Equipment />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/industries" element={<Industries />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/quote" element={<Quote />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/blog" element={<Blog />} />
          
          {/* Blog Articles */}
          <Route path="/blog/grab-hire-vs-skip-hire" element={<GrabVsSkipHire />} />
          <Route path="/blog/grab-lorry-size-guide" element={<GrabLorrySize />} />
          <Route path="/blog/environmental-benefits-waste-removal" element={<EnvironmentalBenefits />} />
          <Route path="/blog/construction-waste-management" element={<ConstructionWasteManagement />} />
          <Route path="/blog/garden-clearance-grab-hire" element={<GardenClearance />} />
          <Route path="/blog/uk-waste-disposal-regulations" element={<WasteRegulations />} />
          
          {/* Legal Pages */}
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
