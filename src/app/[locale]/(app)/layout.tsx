import BottomNav from "@/components/layout/BottomNav";
import { PendingMbtiSaver } from "@/components/PendingMbtiSaver";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PendingMbtiSaver />
      {children}
      <BottomNav />
    </>
  );
}
