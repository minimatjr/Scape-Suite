import { HashRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Layout from "./components/Layout";

import Home from "./pages/Home";
import DeckCalculator from "./pages/DeckCalculator";
import PavingCalculator from "./pages/PavingCalculator";
import FencingCalculator from "./pages/FencingCalculator";
import ConcreteCalculator from "./pages/ConcreteCalculator";
import RetainingWallCalculator from "./pages/RetainingWallCalculator";
import TurfTopsoilCalculator from "./pages/TurfTopsoilCalculator";
import ScapeSuiteManager from "./pages/ScapeSuiteManager";
import ProjectsManager from "./pages/ProjectsManager";
import ContactsManager from "./pages/ContactsManager";


import OfficeLanding from "./paperwork/pages/OfficeLanding";
import QuoteBuilder from "./paperwork/pages/QuoteBuilder";
import InvoiceBuilder from "./paperwork/pages/InvoiceBuilder";
import WorkOrderBuilder from "./paperwork/pages/WorkOrderBuilder";
import ScheduleBuilder from "./paperwork/pages/ScheduleBuilder";
import DepositReceiptBuilder from "./paperwork/pages/DepositReceiptBuilder";
import PaymentReminderBuilder from "./paperwork/pages/PaymentReminderBuilder";

import RequireAuth from "./auth/RequireAuth";
import AuthPage from "./auth/AuthPage";

function App() {
  return (
    <HashRouter>
      <Navbar />
      <div className="nav-spacer" />
      <Routes>
        <Route path="/" element={<Layout><Home /></Layout>} />
        <Route path="/deck" element={<Layout><DeckCalculator /></Layout>} />
        <Route path="/paving" element={<Layout><PavingCalculator /></Layout>} />
        <Route path="/fencing" element={<Layout><FencingCalculator /></Layout>} />
        <Route path="/concrete" element={<Layout><ConcreteCalculator /></Layout>} />
        <Route path="/retainingwall" element={<Layout><RetainingWallCalculator /></Layout>} />
        <Route path="/lawn" element={<Layout><TurfTopsoilCalculator /></Layout>} />
        <Route path="/suite" element={<Layout><ScapeSuiteManager /></Layout>} />
        <Route path="/contacts" element={<Layout><ContactsManager /></Layout>} />
        <Route path="/projects" element={<Layout><ProjectsManager /></Layout>} />

        {/* ✅ Dedicated login route */}
        <Route path="/login" element={<Layout><AuthPage /></Layout>} />

        {/* ✅ Protected paperwork routes */}
        <Route
          path="/paperwork/landing"
          element={<RequireAuth><Layout><OfficeLanding /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/quote"
          element={<RequireAuth><Layout><QuoteBuilder /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/invoice"
          element={<RequireAuth><Layout><InvoiceBuilder /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/work-order"
          element={<RequireAuth><Layout><WorkOrderBuilder /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/schedule"
          element={<RequireAuth><Layout><ScheduleBuilder /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/deposit-receipt"
          element={<RequireAuth><Layout><DepositReceiptBuilder /></Layout></RequireAuth>}
        />
        <Route
          path="/paperwork/payment-reminder"
          element={<RequireAuth><Layout><PaymentReminderBuilder /></Layout></RequireAuth>}
        />
      </Routes>
    </HashRouter>
  );
}

export default App;
