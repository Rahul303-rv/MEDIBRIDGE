import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Surgery Packages — MediBridge",
  description: "All-inclusive surgery packages at India's top hospitals. Includes flights, accommodation, transfers and visa support.",
  openGraph: {
    title: "Surgery Packages — MediBridge",
    description: "Affordable all-inclusive surgery packages at world-class Indian hospitals.",
    type: "website",
  },
};

export default function PackagesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
