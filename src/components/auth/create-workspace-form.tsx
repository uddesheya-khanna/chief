"use client";

import { useActionState, useEffect, useState } from "react";

import { createWorkspace, type WorkspaceFieldErrors } from "@/actions/org";
import { slugify } from "@/lib/slug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function CreateWorkspaceForm() {
  const [state, action, pending] = useActionState<
    WorkspaceFieldErrors | null,
    FormData
  >(createWorkspace, null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!slugTouched) {
      setSlug(slugify(name));
    }
  }, [name, slugTouched]);

  return (
    <form action={action} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="Acme Strategy"
          autoComplete="organization"
        />
        {state?.name?.length ? (
          <p className="text-xs text-destructive">{state.name[0]}</p>
        ) : null}
      </div>
      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="shrink-0 select-none">chief.app/w/</span>
          <Input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            required
            className="font-mono text-xs"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Lowercase letters, numbers, and hyphens. You can change this before
          inviting the team.
        </p>
        {state?.slug?.length ? (
          <p className="text-xs text-destructive">{state.slug[0]}</p>
        ) : null}
      </div>
      {state?._form?.length ? (
        <p className="text-sm text-destructive">{state._form[0]}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Creating workspace…" : "Create workspace"}
      </Button>
    </form>
  );
}
