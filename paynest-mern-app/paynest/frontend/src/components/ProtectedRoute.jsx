import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Spinner from "./Spinner";
import BottomNav from "./BottomNav";

export default function ProtectedRoute({ children, nav = true }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-shell">
        <Spinner page />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      {children}
      {nav && <BottomNav />}
    </div>
  );
}
