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
import { Pencil, Trash2, Plus } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { brl, formatDate, MESES, TIPOS_DESPESA, FORMAS_PAGAMENTO } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/despesas")({ component: DespesasPage });

const now = new Date();
const empty = {
  imovel_id: "", mes: now.getMonth() + 1, ano: now.getFullYear(),
  tipo: "Manutenção", valor: 0, data_despesa: new Date().toISOString().slice(0, 10),
  descricao: "", forma_pagamento: "",
};

function DespesasPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterMes, setFilterMes] = useState("todos");
  const [filterAno, setFilterAno] = useState(String(now.getFullYear()));
  const [filterImovel, setFilterImovel] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);

  const { data: despesas = [] } = useQuery({
    queryKey: ["despesas"],
    queryFn: async () => (await supabase.from("despesas").select("*, imoveis(nome)").order("data_despesa", { ascending: false })).data ?? [],
  });
  const { data: imoveis = [] } = useQuery({
    queryKey: ["imoveis-options"],
    queryFn: async () => (await supabase.from("imoveis").select("id,nome").order("nome")).data ?? [],
  });

  const filtered = despesas.filter((d: any) =>
    (filterMes === "todos" || d.mes === Number(filterMes)) &&
    (filterAno === "todos" || d.ano === Number(filterAno)) &&
    (filterImovel === "todos" || d.imovel_id === filterImovel)
  );

  const total = filtered.reduce((s: number, d: any) => s + Number(d.valor), 0);

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (d: any) => { setEditing(d); setForm({ ...d, data_despesa: d.data_despesa ?? "" }); setOpen(true); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { imoveis, ...rest } = form;
    const payload: any = {
      ...rest, user_id: user!.id,
      valor: Number(form.valor), mes: Number(form.mes), ano: Number(form.ano),
      data_despesa: form.data_despesa || null, imovel_id: form.imovel_id || null,
    };
    const { error } = editing
      ? await supabase.from("despesas").update(payload).eq("id", editing.id)
      : await supabase.from("despesas").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Despesa salva!"); setOpen(false); qc.invalidateQueries({ queryKey: ["despesas"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir despesa?")) return;
    await supabase.from("despesas").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["despesas"] });
  };

  const anos = Array.from(new Set([now.getFullYear(), ...despesas.map((d: any) => d.ano)])).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Despesas</h1>
          <p className="text-sm text-muted-foreground">Total filtrado: <span className="font-semibold text-destructive">{brl(total)}</span></p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Nova despesa</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterMes} onValueChange={setFilterMes}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os meses</SelectItem>
              {MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterAno} onValueChange={setFilterAno}>
            <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterImovel} onValueChange={setFilterImovel}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os imóveis</SelectItem>
              {imoveis.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Data</TableHead><TableHead>Imóvel</TableHead><TableHead>Tipo</TableHead>
              <TableHead>Descrição</TableHead><TableHead>Valor</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Sem despesas.</TableCell></TableRow>
                : filtered.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell>{formatDate(d.data_despesa)}</TableCell>
                    <TableCell className="font-medium">{d.imoveis?.nome ?? "—"}</TableCell>
                    <TableCell>{d.tipo}</TableCell>
                    <TableCell className="text-sm">{d.descricao}</TableCell>
                    <TableCell>{brl(d.valor)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(d)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(d.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Editar despesa" : "Nova despesa"} onSubmit={submit} busy={busy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Imóvel</Label>
            <Select value={form.imovel_id || undefined} onValueChange={v => setForm({ ...form, imovel_id: v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>{imoveis.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tipo</Label>
            <Select value={form.tipo} onValueChange={v => setForm({ ...form, tipo: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{TIPOS_DESPESA.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mês</Label>
            <Select value={String(form.mes)} onValueChange={v => setForm({ ...form, mes: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Ano</Label><Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} /></div>
          <div><Label>Valor</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
          <div><Label>Data da despesa</Label><Input type="date" value={form.data_despesa} onChange={e => setForm({ ...form, data_despesa: e.target.value })} /></div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.forma_pagamento || undefined} onValueChange={v => setForm({ ...form, forma_pagamento: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
