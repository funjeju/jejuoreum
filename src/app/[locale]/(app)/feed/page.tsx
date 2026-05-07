export const dynamic = "force-dynamic";

import { getPublicFeed } from "@/lib/firestore/feed";
import FeedClient from "./FeedClient";

export default async function FeedPage() {
  const events = await getPublicFeed({ limitCount: 30 });
  return <FeedClient initialEvents={events} />;
}
