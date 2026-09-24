import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export function FormDialog({
  trigger, title, children, open, onOpenChange, onSubmit, busy, submitLabel = "Salvar",
}: {
  trigger?: ReactNode;
  title: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  onSubmit: (e: React.FormEvent) => void | Promise<void>;
  busy?: boolean;
  submitLabel?: string;
}) {
  const [internal, setInternal] = useState(false);
  const isOpen = open ?? internal;
  const setOpen = onOpenChange ?? setInternal;
  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4">
          {children}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={busy}>{busy ? "Salvando..." : submitLabel}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddButton({ onClick, label = "Adicionar" }: { onClick?: () => void; label?: string }) {
  return (
    <Button onClick={onClick}>
      <Plus className="w-4 h-4" /> {label}
    </Button>
  );
}
