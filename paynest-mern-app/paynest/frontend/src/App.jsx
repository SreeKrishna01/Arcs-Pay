import { useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

import Splash from "./pages/Splash";
import Onboarding from "./pages/Onboarding";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import AddMoney from "./pages/AddMoney";
import SendMoney from "./pages/SendMoney";
import ConfirmPay from "./pages/ConfirmPay";
import PaymentSuccess from "./pages/PaymentSuccess";
import Transactions from "./pages/Transactions";
import TransactionDetails from "./pages/TransactionDetails";
import MyCards from "./pages/MyCards";
import ScanQR from "./pages/ScanQR";
import Recipients from "./pages/Recipients";
import Profile from "./pages/Profile";
import ProfileDetails from "./pages/ProfileDetails";
import BankAccounts from "./pages/BankAccounts";
import Settings from "./pages/Settings";
import HelpSupport from "./pages/HelpSupport";
import Security from "./pages/Security";
import Notifications from "./pages/Notifications";

function App() {
  const { user } = useAuth();
  const theme = user?.settings?.theme === "dark" ? "dark" : "light";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", theme === "light" ? "#f3f0fa" : "#0D0820");
  }, [theme]);

  return (
    <div className="app-viewport">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Splash />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Main tabs (with bottom nav) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cards"
          element={
            <ProtectedRoute>
              <MyCards />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Secondary / task screens (no bottom nav) */}
        <Route
          path="/scan"
          element={
            <ProtectedRoute nav={false}>
              <ScanQR />
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-money"
          element={
            <ProtectedRoute nav={false}>
              <AddMoney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/send-money"
          element={
            <ProtectedRoute nav={false}>
              <SendMoney />
            </ProtectedRoute>
          }
        />
        <Route
          path="/confirm-pay"
          element={
            <ProtectedRoute nav={false}>
              <ConfirmPay />
            </ProtectedRoute>
          }
        />
        <Route
          path="/payment-success"
          element={
            <ProtectedRoute nav={false}>
              <PaymentSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions/:id"
          element={
            <ProtectedRoute nav={false}>
              <TransactionDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recipients"
          element={
            <ProtectedRoute nav={false}>
              <Recipients />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/details"
          element={
            <ProtectedRoute nav={false}>
              <ProfileDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/bank-accounts"
          element={
            <ProtectedRoute nav={false}>
              <BankAccounts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute nav={false}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/help"
          element={
            <ProtectedRoute nav={false}>
              <HelpSupport />
            </ProtectedRoute>
          }
        />
        <Route
          path="/security"
          element={
            <ProtectedRoute nav={false}>
              <Security />
            </ProtectedRoute>
          }
        />
        <Route
          path="/notifications"
          element={
            <ProtectedRoute nav={false}>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
