"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function LogoutButton({ className }: { className?: string }) {
  const supabase = createClient();
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    setPending(true);
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <Button type="button" variant="ghost" size="sm" className={className} disabled={pending} onClick={handleLogout}>
      {pending ? "Signing out…" : "Log out"}
    </Button>
  );
}
