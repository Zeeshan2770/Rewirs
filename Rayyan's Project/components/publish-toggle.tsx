"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function PublishToggle({
  published,
  onToggle,
}: {
  published: boolean;
  onToggle: (next: boolean) => Promise<void>;
}) {
  const [state, setState] = useState(published);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <Badge status={state ? "published" : "draft"}>{state ? "Published" : "Draft"}</Badge>
      <Button
        size="sm"
        variant="secondary"
        disabled={pending}
        onClick={() => {
          const next = !state;
          setState(next);
          startTransition(() => onToggle(next));
        }}
      >
        {state ? "Unpublish" : "Publish"}
      </Button>
    </div>
  );
}
