"use client";

import { Save, Trash2 } from "lucide-react";
import { Button } from "./Button";

export function EditorFooter({
  onSave,
  onDelete,
  canSave = true,
  saveLabel = "SALVA",
}: {
  onSave: () => void;
  onDelete?: () => void;
  canSave?: boolean;
  saveLabel?: string;
}) {
  return (
    <>
      {onDelete && (
        <Button
          variant="danger"
          size="lg"
          aria-label="Elimina"
          onClick={() => {
            if (confirm("Eliminare definitivamente?")) onDelete();
          }}
        >
          <Trash2 size={22} />
        </Button>
      )}
      <Button variant="primary" size="lg" className="flex-1" disabled={!canSave} onClick={onSave}>
        <Save size={22} /> {saveLabel}
      </Button>
    </>
  );
}
