import type { Metadata } from "next";
import { SignUpForm } from "@/components/AuthComponents/SignUpForm";

export const metadata: Metadata = {
  title: "Crear cuenta",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
