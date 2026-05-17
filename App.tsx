import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Header from "@/components/Header";
import Home from "@/pages/Home";
import PropertyDetail from "@/pages/PropertyDetail";
import AgentDashboard from "@/pages/AgentDashboard";
import SellerValuation from "@/pages/SellerValuation";
import SellerValuationResult from "@/pages/SellerValuationResult";
import SavedProperties from "@/pages/SavedProperties";
import VendorDashboard from "@/pages/VendorDashboard";
import BuyerDiscovery from "@/pages/BuyerDiscovery";
import AgentLanding from "@/pages/AgentLanding";
import AgentRegistration from "@/pages/AgentRegistration";
import Profile from "@/pages/Profile";
import BetaSignup from "@/pages/BetaSignup";
import Privacy from "@/pages/Privacy";
import Terms from "@/pages/Terms";
import Cookies from "@/pages/Cookies";
import Contact from "@/pages/Contact";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/sell/valuation"} component={SellerValuationResult} />
      <Route path={"/sell"} component={SellerValuation} />
      <Route path={"/property/:id"} component={PropertyDetail} />
      <Route path={"/discover"} component={BuyerDiscovery} />
      <Route path={"/saved"} component={SavedProperties} />
      <Route path={"/profile"} component={Profile} />
      <Route path={"/agent-dashboard"} component={AgentDashboard} />
      <Route path={"/vendor/dashboard"} component={VendorDashboard} />
      <Route path={"/agents"} component={AgentLanding} />
      <Route path={"/agents/register"} component={AgentRegistration} />
      <Route path={"/beta-signup"} component={BetaSignup} />
      <Route path={"/privacy"} component={Privacy} />
      <Route path={"/terms"} component={Terms} />
      <Route path={"/cookies"} component={Cookies} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/404"} component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Header />
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
