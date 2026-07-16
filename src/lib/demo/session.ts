import { cookies } from "next/headers";
import { DEMO_SESSION_COOKIE, DEMO_USER_ID } from "./constants";

/** Reads the demo session cookie server-side. Returns the fixed demo user
 * id if logged in, null otherwise. There is exactly one demo user in this
 * build — this is a one-click-login artifact, not a multi-tenant auth
 * system, and is documented as such. */
export async function getDemoUserId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(DEMO_SESSION_COOKIE)?.value;
  return value === DEMO_USER_ID ? DEMO_USER_ID : null;
}
