import { SignUp } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { AuthRedirectGuard } from "@/components/auth/auth-redirect-guard";
import { AuthPageShell } from "@/components/auth/auth-page-shell";
import { clerkAppearance } from "@/lib/clerk-appearance";

export default async function SignUpPage() {
  const { isAuthenticated } = await auth();

  if (isAuthenticated) {
    redirect("/editor");
  }

  return (
    <AuthPageShell mode="sign-up">
      <AuthRedirectGuard />
      <SignUp
        appearance={clerkAppearance}
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        forceRedirectUrl="/editor"
        fallbackRedirectUrl="/editor"
      />
    </AuthPageShell>
  );
}
