import { redirect } from "next/navigation";
import { getDemoUserId } from "@/lib/demo/session";

export default async function RootPage() {
  const userId = await getDemoUserId();
  redirect(userId ? "/dashboard" : "/login");
}
