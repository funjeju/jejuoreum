export const dynamic = "force-dynamic";

import { adminDb } from "@/lib/firebase/admin";
import AdminDashboard from "./AdminDashboard";

async function getStats() {
  const [oreums, users] = await Promise.all([
    adminDb.collection("oreums").count().get(),
    adminDb.collection("users").count().get(),
  ]);
  return {
    oreumCount: oreums.data().count,
    userCount:  users.data().count,
  };
}

export default async function AdminPage() {
  const stats = await getStats();
  return <AdminDashboard stats={stats} />;
}
