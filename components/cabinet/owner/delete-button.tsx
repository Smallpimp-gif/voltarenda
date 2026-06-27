"use client";

import { deleteTenantAction } from "@/lib/auth/owner-actions";

export function DeleteTenantButton({ id, name }: { id: string; name: string }) {
  return (
    <form
      action={deleteTenantAction}
      onSubmit={(e) => {
        if (!confirm(`Удалить арендатора «${name}»? Это действие необратимо.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <button
        type="submit"
        className="text-caption text-mute transition-colors duration-quick hover:text-danger"
      >
        Удалить
      </button>
    </form>
  );
}
