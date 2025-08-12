// pages/index.js
import { useRequireAuth } from "../hooks/useRequireAuth";
import DashboardClient from "./DashboardClient";

export default function Dashboard() {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <div>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to signin
  }

  return <DashboardClient />;
}
