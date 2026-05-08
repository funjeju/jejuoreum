import webpush from "web-push";
import { adminDb } from "@/lib/firebase/admin";

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
}

export async function sendPushToUser(uid: string, payload: PushPayload) {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) return;

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? "mailto:admin@jejuoreum.com",
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );

  const subsSnap = await adminDb
    .collection("users")
    .doc(uid)
    .collection("pushSubscriptions")
    .get();

  if (subsSnap.empty) return;

  const data = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon ?? "/icon.svg",
    badge: payload.badge ?? "/icon.svg",
    data: { url: payload.url ?? "/" },
  });

  const sends = subsSnap.docs.map(async (doc) => {
    const sub = doc.data() as webpush.PushSubscription;
    try {
      await webpush.sendNotification(sub, data);
    } catch (err: unknown) {
      if (
        err instanceof Error &&
        "statusCode" in err &&
        ((err as { statusCode: number }).statusCode === 404 ||
          (err as { statusCode: number }).statusCode === 410)
      ) {
        // Subscription expired — remove it
        await doc.ref.delete();
      }
    }
  });

  await Promise.allSettled(sends);
}
