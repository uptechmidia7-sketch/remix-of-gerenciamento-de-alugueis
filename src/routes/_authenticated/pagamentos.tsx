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
import { Pencil, Trash2, Plus, CheckCircle2 } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, formatDate, MESES, STATUS_PAGAMENTO, FORMAS_PAGAMENTO, vencimentoDe, statusPagamento, hoje, cobrancasTodas } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pagamentos")({ component: PagamentosPage });

const now = new Date();
const empty = {
  imovel_id: "" as string, inquilino_id: "" as string,
  mes: now.getMonth() + 1, ano: now.getFullYear(),
  valor: 0, data_pagamento: "",
  forma_pagamento: "", observacoes: "",
};

function PagamentosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [filterMes, setFilterMes] = useState<string>("todos");
  const [filterAno, setFilterAno] = useState<string>(String(now.getFullYear()));
  const [filterStatus, setFilterStatus] = useState("todos");
  const [filterImovel, setFilterImovel] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);

  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: async () => (await supabase.from("pagamentos").select("*, imoveis(nome), inquilinos(nome)").order("ano", { ascending: false }).order("mes", { ascending: false })).data ?? [],
  });
  const { data: imoveis = [] } = useQuery({ queryKey: ["imoveis-options"], queryFn: async () => (await supabase.from("imoveis").select("id,nome,valor_aluguel").order("nome")).data ?? [] });
  const { data: inquilinos = [] } = useQuery({ queryKey: ["inquilinos-options"], queryFn: async () => (await supabase.from("inquilinos").select("id,nome,imovel_id,valor_aluguel,dia_vencimento,data_entrada,data_saida,imoveis(nome,valor_aluguel)").order("nome")).data ?? [] });

  // inclui os meses esperados (desde a entrada do inquilino) que ainda não foram lançados
  const todas = cobrancasTodas(inquilinos, pagamentos);

  const filtered = todas.filter((p: any) =>
    (filterMes === "todos" || p.mes === Number(filterMes)) &&
    (filterAno === "todos" || p.ano === Number(filterAno)) &&
    (filterStatus === "todos" || statusPagamento(p) === filterStatus) &&
    (filterImovel === "todos" || p.imovel_id === filterImovel)
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (p: any) => {
    setEditing(p.virtual ? null : p);
    const { id: _id, virtual: _v, created_at: _c, ...rest } = p;
    setForm({ ...rest, data_pagamento: p.data_pagamento ?? "" });
    setOpen(true);
  };

  const onInquilinoChange = (id: string) => {
    const inq = inquilinos.find((i: any) => i.id === id);
    if (inq) {
      setForm({ ...form, inquilino_id: id, imovel_id: inq.imovel_id ?? form.imovel_id, valor: inq.valor_aluguel ?? form.valor });
    } else setForm({ ...form, inquilino_id: id });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { imoveis: _im, inquilinos: _inq, status: _st, data_vencimento: _dv, ...rest } = form;
    const inq = inquilinos.find((i: any) => i.id === form.inquilino_id);
    const venc = vencimentoDe(Number(form.mes), Number(form.ano), inq?.dia_vencimento);
    const base = {
      ...rest, user_id: user!.id,
      valor: Number(form.valor), mes: Number(form.mes), ano: Number(form.ano),
      data_vencimento: venc,
      data_pagamento: form.data_pagamento || null,
      imovel_id: form.imovel_id || null,
      inquilino_id: form.inquilino_id || null,
    };
    const payload: any = { ...base, status: statusPagamento(base) };
    const { error } = editing
      ? await supabase.from("pagamentos").update(payload).eq("id", editing.id)
      : await supabase.from("pagamentos").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Pagamento salvo!"); setOpen(false);
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["inquilinos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  const marcarPago = async (p: any) => {
    const { error } = p.virtual
      ? await supabase.from("pagamentos").insert({
          user_id: user!.id, imovel_id: p.imovel_id ?? null, inquilino_id: p.inquilino_id ?? null,
          mes: Number(p.mes), ano: Number(p.ano), valor: Number(p.valor),
          data_vencimento: p.data_vencimento, data_pagamento: hoje(), status: "pago",
        })
      : await supabase.from("pagamentos").update({ status: "pago", data_pagamento: hoje() }).eq("id", p.id);
    if (error) toast.error(error.message);
    else {
      toast.success("Marcado como pago");
      qc.invalidateQueries({ queryKey: ["pagamentos"] });
      qc.invalidateQueries({ queryKey: ["inquilinos"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir pagamento?")) return;
    await supabase.from("pagamentos").delete().eq("id", id);
    qc.invalidateQueries({ queryKey: ["pagamentos"] });
  };

  const anos = Array.from(new Set([now.getFullYear(), ...todas.map((p: any) => Number(p.ano))])).sort((a, b) => b - a);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Pagamentos</h1>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Novo pagamento</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <Select value={filterMes} onValueChange={setFilterMes}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Mês" /></SelectTrigger>
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
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos status</SelectItem>
              {STATUS_PAGAMENTO.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterImovel} onValueChange={setFilterImovel}>
            <SelectTrigger className="w-48"><SelectValue placeholder="Imóvel" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os imóveis</SelectItem>
              {imoveis.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Mês/Ano</TableHead><TableHead>Imóvel</TableHead><TableHead>Inquilino</TableHead>
              <TableHead>Valor</TableHead><TableHead>Vencimento</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Nenhum pagamento.</TableCell></TableRow>
                : filtered.map((p: any) => {
                  const st = statusPagamento(p);
                  return (
                  <TableRow key={p.id} className={st === "atrasado" ? "bg-destructive/5" : ""}>
                    <TableCell>{MESES[p.mes - 1]?.slice(0, 3)}/{p.ano}</TableCell>
                    <TableCell className="font-medium">{p.imoveis?.nome ?? "—"}</TableCell>
                    <TableCell>{p.inquilinos?.nome ?? "—"}</TableCell>
                    <TableCell>{brl(p.valor)}</TableCell>
                    <TableCell>{formatDate(p.data_vencimento)}</TableCell>
                    <TableCell className="space-x-1">
                      <StatusBadge status={st} />
                      {p.virtual && <span className="text-xs text-muted-foreground">não lançado</span>}
                    </TableCell>
                    <TableCell className="text-right">
                      {st !== "pago" && <Button variant="ghost" size="icon" onClick={() => marcarPago(p)} title="Marcar pago"><CheckCircle2 className="w-4 h-4 text-success" /></Button>}
                      <Button variant="ghost" size="icon" onClick={() => openEdit(p)} title={p.virtual ? "Lançar pagamento" : "Editar"}><Pencil className="w-4 h-4" /></Button>
                      {!p.virtual && <Button variant="ghost" size="icon" onClick={() => remove(p.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>}
                    </TableCell>
                  </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Editar pagamento" : "Novo pagamento"} onSubmit={submit} busy={busy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Inquilino</Label>
            <Select value={form.inquilino_id || undefined} onValueChange={onInquilinoChange}>
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
          <div>
            <Label>Mês</Label>
            <Select value={String(form.mes)} onValueChange={v => setForm({ ...form, mes: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{MESES.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Ano</Label><Input type="number" value={form.ano} onChange={e => setForm({ ...form, ano: e.target.value })} /></div>
          <div><Label>Valor</Label><Input type="number" step="0.01" value={form.valor} onChange={e => setForm({ ...form, valor: e.target.value })} /></div>
          <div>
            <Label>Data do pagamento</Label>
            <Input type="date" value={form.data_pagamento} onChange={e => setForm({ ...form, data_pagamento: e.target.value })} />
            <p className="text-xs text-muted-foreground mt-1">
              Vencimento automático: {(() => {
                const inq = inquilinos.find((i: any) => i.id === form.inquilino_id);
                const v = vencimentoDe(Number(form.mes), Number(form.ano), inq?.dia_vencimento);
                return v ? formatDate(v) : "selecione o inquilino";
              })()} • Deixe a data em branco enquanto não receber.
            </p>
          </div>
          <div>
            <Label>Forma de pagamento</Label>
            <Select value={form.forma_pagamento || undefined} onValueChange={v => setForm({ ...form, forma_pagamento: v })}>
              <SelectTrigger><SelectValue placeholder="—" /></SelectTrigger>
              <SelectContent>{FORMAS_PAGAMENTO.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
