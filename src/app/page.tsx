import { redirect } from "next/navigation";

export const metadata = {
  title: "Sign In — NIRNAY Monitoring Platform",
  description:
    "Secure access portal for NIRNAY — National Decision Support & Monitoring Engine.",
};

export default function RootPage() {
  redirect("/login");
}
