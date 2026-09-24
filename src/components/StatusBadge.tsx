import { Badge } from "@/components/ui/badge";

const map: Record<string, { label: string; cls: string }> = {
  alugado: { label: "Alugado", cls: "bg-success/15 text-success border-success/30" },
  vago: { label: "Vago", cls: "bg-warning/20 text-warning-foreground border-warning/30" },
  manutencao: { label: "Manutenção", cls: "bg-accent text-accent-foreground" },
  ativo: { label: "Ativo", cls: "bg-success/15 text-success border-success/30" },
  inativo: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
  atrasado: { label: "Atrasado", cls: "bg-destructive/15 text-destructive border-destructive/30" },
  pago: { label: "Pago", cls: "bg-success/15 text-success border-success/30" },
  pendente: { label: "Pendente", cls: "bg-warning/20 text-warning-foreground border-warning/30" },
};

export function StatusBadge({ status }: { status: string }) {
  const m = map[status] ?? { label: status, cls: "" };
  return <Badge variant="outline" className={m.cls}>{m.label}</Badge>;
}
