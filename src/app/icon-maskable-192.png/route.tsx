import { brandIcon } from "@/lib/og-icon";

export const dynamic = "force-static";

export function GET() {
  return brandIcon(192, "maskable");
}
