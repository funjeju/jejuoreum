import { adminAuth } from "@/lib/firebase/admin";

export interface AdminUserRecord {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: string;
  lastSignIn: string | null;
  isAdmin: boolean;
}

export async function adminListUsers(maxResults = 200): Promise<AdminUserRecord[]> {
  const listResult = await adminAuth.listUsers(maxResults);
  return listResult.users.map((u) => ({
    uid: u.uid,
    email: u.email ?? null,
    displayName: u.displayName ?? null,
    photoURL: u.photoURL ?? null,
    createdAt: u.metadata.creationTime ?? "",
    lastSignIn: u.metadata.lastSignInTime ?? null,
    isAdmin: !!((u.customClaims as Record<string, unknown> | undefined)?.admin),
  }));
}

export async function adminSetAdminClaim(uid: string, isAdmin: boolean): Promise<void> {
  await adminAuth.setCustomUserClaims(uid, { admin: isAdmin });
}
