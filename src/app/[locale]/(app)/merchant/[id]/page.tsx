import { getMerchant } from "@/lib/firestore/merchants";
import { notFound } from "next/navigation";
import MerchantDetailClient from "./MerchantDetailClient";

export const dynamic = "force-dynamic";

export default async function MerchantDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { id } = await params;
  const merchant = await getMerchant(id);
  if (!merchant || !merchant.isPublished) notFound();
  return <MerchantDetailClient merchant={merchant} />;
}
