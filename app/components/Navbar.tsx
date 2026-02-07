import { auth } from "@/auth";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const session = await auth();
  let user = null;
  let isAdmin = false;

  if (session?.user) {
    user = { name: session.user.name, image: session.user.image };

    if (session.user.email) {
      try {
        const supabase = await createClient();
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("auth_user_email", session.user.email)
          .single();
        if (profile) isAdmin = profile.is_admin;
      } catch {
        // profiles table may not exist yet
      }
    }
  }

  return <NavbarClient user={user} isAdmin={isAdmin} />;
}
