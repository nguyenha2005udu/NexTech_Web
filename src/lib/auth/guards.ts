import "server-only";
import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { can, type Action } from "@/lib/permissions";
import { getSessionUser } from "./session";

// Mục 10.2 — dùng trong page (Server Component) và Server Action.

export async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect(routes.login); // 401
  return user;
}

export async function requirePermission(action: Action) {
  const user = await requireUser();
  if (!can(user.role, action)) redirect(routes.forbidden); // 403
  return user;
}
