import type { Metadata } from "next";
import { SignInForm } from "@/components/AuthComponents/SignInForm";

export const metadata: Metadata = {
  title: "Acceder",
};

export default function SignInPage() {
  return <SignInForm />;
}
