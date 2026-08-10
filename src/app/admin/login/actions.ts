"use server";

import { AuthError } from "next-auth";
import { signIn } from "@/lib/auth";

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState | null,
  formData: FormData
): Promise<LoginState> {
  const passkey = formData.get("passkey");
  const callbackUrl = (formData.get("callbackUrl") as string) || "/admin";

  if (typeof passkey !== "string" || !passkey) {
    return { error: "Enter the passkey." };
  }

  try {
    await signIn("credentials", { passkey, redirectTo: callbackUrl });
    return {};
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Invalid passkey." };
    }
    // NEXT_REDIRECT and other framework-internal throws must propagate
    throw err;
  }
}
