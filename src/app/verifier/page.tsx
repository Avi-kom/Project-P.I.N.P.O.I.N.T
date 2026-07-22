import { redirect } from "next/navigation";

export default function VerifierRedirectPage() {
  redirect("/admin/verify");
}
