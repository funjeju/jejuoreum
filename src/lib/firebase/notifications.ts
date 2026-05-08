import { adminDb } from "@/lib/firebase/admin";
import { sendPushToUser } from "@/lib/push/send";
import type { NotificationType } from "@/types";

interface CreateNotifOpts {
  uid: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  imageUrl?: string;
}

export async function createNotification(opts: CreateNotifOpts) {
  await adminDb
    .collection("users")
    .doc(opts.uid)
    .collection("notifications")
    .add({
      type: opts.type,
      title: opts.title,
      body: opts.body,
      link: opts.link ?? null,
      imageUrl: opts.imageUrl ?? null,
      isRead: false,
      createdAt: new Date().toISOString(),
    });

  // Fire-and-forget web push
  sendPushToUser(opts.uid, {
    title: opts.title,
    body: opts.body,
    url: opts.link ?? "/ko/notifications",
  }).catch(() => {});
}
