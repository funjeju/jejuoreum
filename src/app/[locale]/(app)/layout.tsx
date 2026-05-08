import BottomNav from "@/components/layout/BottomNav";
import { PendingMbtiSaver } from "@/components/PendingMbtiSaver";
import { PushOptIn } from "@/components/notifications/PushOptIn";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PendingMbtiSaver />
      {children}
      <BottomNav />
      <PushOptIn />
    </>
  );
}
