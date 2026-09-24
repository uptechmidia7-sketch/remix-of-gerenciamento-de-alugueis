import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, FileText, Upload, AlertTriangle } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { brl, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/contratos")({ component: ContratosPage });

const empty = {
  inquilino_id: "", imovel_id: "",
  data_inicio: "", data_fim: "",
  valor_aluguel: 0, valor_caucao: 0, observacoes: "", arquivo_url: "",
};

function ContratosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { data: contratos = [] } = useQuery({
    queryKey: ["contratos"],
    queryFn: async () => (await supabase.from("contratos").select("*, inquilinos(nome), imoveis(nome)").order("data_fim", { ascending: true })).data ?? [],
  });
  const { data: imoveis = [] } = useQuery({ queryKey: ["imoveis-options"], queryFn: async () => (await supabase.from("imoveis").select("id,nome")).data ?? [] });
  const { data: inquilinos = [] } = useQuery({ queryKey: ["inquilinos-options"], queryFn: async () => (await supabase.from("inquilinos").select("id,nome,imovel_id")).data ?? [] });

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (c: any) => {
    const { inquilinos, imoveis, ...rest } = c;
    setEditing(c);
    setForm({ ...rest, data_inicio: c.data_inicio ?? "", data_fim: c.data_fim ?? "" });
    setOpen(true);
  };

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/contratos/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("anexos").upload(path, file);
    setUploading(false);
    e.target.value = "";
    if (error) { toast.error(error.message); return; }
    const { data: pub } = supabase.storage.from("anexos").getPublicUrl(path);
    setForm((f: any) => ({ ...f, arquivo_url: pub.publicUrl }));
    toast.success("Arquivo enviado!");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { inquilinos, imoveis, id, created_at, ...clean } = form as any;
    const payload: any = {
      ...clean, user_id: user!.id,
      valor_aluguel: Number(clean.valor_aluguel) || 0,
      valor_caucao: Number(clean.valor_caucao) || 0,
      data_inicio: clean.data_inicio || null,
      data_fim: clean.data_fim || null,
      inquilino_id: clean.inquilino_id || null,
      imovel_id: clean.imovel_id || null,
    };
    const { error } = editing
      ? await supabase.from("contratos").update(payload).eq("id", editing.id)
      : await supabase.from("contratos").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Contrato salvo!"); setOpen(false); qc.invalidateQueries({ queryKey: ["contratos"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir contrato?")) return;
    await supabase.from("contratos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["contratos"] });
  };

  const diasAteVencer = (d?: string | null) => {
    if (!d) return null;
    return Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Contratos</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Novo contrato</Button>
      </div>

      <Card className="p-4">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Inquilino</TableHead><TableHead>Imóvel</TableHead>
              <TableHead>Início</TableHead><TableHead>Fim</TableHead>
              <TableHead>Valor</TableHead><TableHead>Arquivo</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {contratos.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Sem contratos.</TableCell></TableRow>
                : contratos.map((c: any) => {
                  const dias = diasAteVencer(c.data_fim);
                  const vencendo = dias !== null && dias <= 30 && dias >= 0;
                  const vencido = dias !== null && dias < 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.inquilinos?.nome ?? "—"}</TableCell>
                      <TableCell>{c.imoveis?.nome ?? "—"}</TableCell>
                      <TableCell>{formatDate(c.data_inicio)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatDate(c.data_fim)}
                          {vencendo && <Badge variant="outline" className="bg-warning/20 text-warning-foreground"><AlertTriangle className="w-3 h-3" /> {dias}d</Badge>}
                          {vencido && <Badge variant="destructive">Vencido</Badge>}
                        </div>
                      </TableCell>
                      <TableCell>{brl(c.valor_aluguel)}</TableCell>
                      <TableCell>{c.arquivo_url ? <a href={c.arquivo_url} target="_blank" rel="noreferrer" className="text-primary hover:underline inline-flex items-center gap-1"><FileText className="w-4 h-4" /> Ver</a> : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => remove(c.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Editar contrato" : "Novo contrato"} onSubmit={submit} busy={busy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Inquilino</Label>
            <Select value={form.inquilino_id || undefined} onValueChange={v => {
              const inq = inquilinos.find((i: any) => i.id === v);
              setForm({ ...form, inquilino_id: v, imovel_id: inq?.imovel_id ?? form.imovel_id });
            }}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{inquilinos.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Imóvel</Label>
            <Select value={form.imovel_id || undefined} onValueChange={v => setForm({ ...form, imovel_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{imoveis.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Data início</Label><Input type="date" value={form.data_inicio} onChange={e => setForm({ ...form, data_inicio: e.target.value })} /></div>
          <div><Label>Data fim</Label><Input type="date" value={form.data_fim} onChange={e => setForm({ ...form, data_fim: e.target.value })} /></div>
          <div><Label>Valor aluguel</Label><Input type="number" step="0.01" value={form.valor_aluguel} onChange={e => setForm({ ...form, valor_aluguel: e.target.value })} /></div>
          <div><Label>Valor caução</Label><Input type="number" step="0.01" value={form.valor_caucao} onChange={e => setForm({ ...form, valor_caucao: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Contrato (PDF)</Label>
            <div className="flex items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" hidden accept=".pdf,image/*" onChange={upload} />
                <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Anexar"}
                </span>
              </label>
              {form.arquivo_url && <a href={form.arquivo_url} target="_blank" rel="noreferrer" className="text-sm text-primary hover:underline">Ver arquivo</a>}
            </div>
          </div>
          <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
