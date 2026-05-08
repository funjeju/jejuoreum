export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebase/admin";
import AdminDashboard from "./AdminDashboard";

async function getStats() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [
    oreums, users,
    todayDiscoveries,
    pendingPhotos,
    pendingReports,
    pendingTrendAlerts,
    pendingMerchants,
  ] = await Promise.all([
    adminDb.collection("oreums").count().get(),
    adminDb.collection("users").count().get(),
    adminDb.collection("discoveries")
      .where("discoveredAt", ">=", todayStart.toISOString())
      .count().get(),
    adminDb.collection("photos")
      .where("isApproved", "==", false)
      .count().get(),
    adminDb.collection("reports")
      .where("status", "==", "pending")
      .count().get(),
    adminDb.collection("trendAlerts")
      .where("status", "==", "pending")
      .count().get(),
    adminDb.collection("merchants")
      .where("status", "==", "pending")
      .count().get(),
  ]);

  return {
    oreumCount:            oreums.data().count,
    userCount:             users.data().count,
    todayDiscoveryCount:   todayDiscoveries.data().count,
    pendingPhotoCount:     pendingPhotos.data().count,
    pendingReportCount:    pendingReports.data().count,
    pendingTrendAlertCount: pendingTrendAlerts.data().count,
    pendingMerchantCount:  pendingMerchants.data().count,
  };
}

export default async function AdminPage() {
  const stats = await getStats();
  return <AdminDashboard stats={stats} />;
}
