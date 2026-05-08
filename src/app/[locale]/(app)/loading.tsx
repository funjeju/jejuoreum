import { Loader2 } from "lucide-react";

export default function AppLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 size={28} className="animate-spin text-muted-foreground" />
    </div>
  );
}
