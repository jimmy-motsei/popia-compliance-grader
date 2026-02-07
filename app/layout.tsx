import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "POPIA Compliance Grader | Maru",
  description: "Automated website POPIA compliance scan and grading."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
