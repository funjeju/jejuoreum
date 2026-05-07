import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  const body = await req.json();

  const required = ["store_name", "category", "address", "owner_name", "owner_email", "owner_phone"];
  for (const field of required) {
    if (!body[field]) {
      return NextResponse.json({ error: `${field} is required` }, { status: 400 });
    }
  }

  await adminDb.collection("partnerApplications").add({
    storeName:                  body.store_name,
    category:                   body.category,
    address:                    body.address,
    ownerName:                  body.owner_name,
    ownerEmail:                 body.owner_email,
    ownerPhone:                 body.owner_phone,
    businessRegistrationNumber: body.business_registration_number ?? null,
    instagramHandle:            body.instagram_handle ?? null,
    motivation:                 body.motivation ?? null,
    status:                     "pending",
    createdAt:                  new Date().toISOString(),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
