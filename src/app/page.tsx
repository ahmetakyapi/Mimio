import type { Metadata } from "next";
import { ClientRoot } from "@/components/ClientRoot";

export const metadata: Metadata = {
  title: "Mimio | Ergoterapi Oyun Platformu",
  description:
    "Danışan takibi, oyun seansları, haftalık planlar ve seans notları — ergoterapistler için tek platform.",
};

export default function HomePage() {
  return <ClientRoot />;
}
