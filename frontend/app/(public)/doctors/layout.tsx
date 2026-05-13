import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Find a Doctor — MediBridge",
  description: "Browse verified Indian doctors for online consultations. Filter by specialization and book a same-day appointment.",
  openGraph: {
    title: "Find a Doctor — MediBridge",
    description: "Browse verified Indian specialists for same-day online consultations.",
    type: "website",
  },
};

export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
