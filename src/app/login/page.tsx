import { Suspense } from "react";
import LoginPage from "@/components/auth/LoginPage";

export const metadata = {
  title: "Sign In — NIRNAY Monitoring Platform",
  description:
    "Secure access portal for NIRNAY — National Decision Support & Monitoring Engine.",
};

export default function LoginRoute() {
  return (
    <Suspense fallback={null}>
      <LoginPage />
    </Suspense>
  );
}
