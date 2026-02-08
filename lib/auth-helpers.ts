import { auth } from "@/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Profile } from "@/lib/types/database";

export async function getSessionOrThrow() {
  const session = await auth();
  if (!session?.user?.email) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function getProfileByEmail(
  email: string,
  name?: string | null,
  image?: string | null
): Promise<Profile> {
  const supabase = createAdminClient();

  const { data: existing } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_email", email)
    .single();

  if (existing) {
    // Refresh avatar if it changed or was previously stored as garbage
    if (
      image &&
      image !== existing.avatar_url &&
      image.startsWith("http")
    ) {
      await supabase
        .from("profiles")
        .update({ avatar_url: image })
        .eq("id", existing.id);
      existing.avatar_url = image;
    }
    return existing as Profile;
  }

  // If a real name was provided (e.g. Facebook), mark display_name_set = true
  const hasRealName = !!name && name !== email.split("@")[0];

  const { data: created, error } = await supabase
    .from("profiles")
    .insert({
      auth_user_email: email,
      display_name: name ?? email.split("@")[0],
      avatar_url: image ?? null,
      display_name_set: hasRealName,
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to create profile: ${error.message}`);
  return created as Profile;
}

export async function requireAdmin(email: string): Promise<Profile> {
  const profile = await getProfileByEmail(email);
  if (!profile.is_admin) {
    throw new Error("Forbidden: admin access required");
  }
  return profile;
}
