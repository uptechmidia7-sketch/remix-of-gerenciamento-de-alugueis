import { createFileRoute, Link } from "@tanstack/react-router";
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
import { Pencil, Trash2, Eye, Plus, Search, Upload, FileText } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { STATUS_INQUILINO, brl, statusInquilino } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inquilinos")({ component: InquilinosPage });

const empty = {
  nome: "", cpf: "", rg: "", telefone: "", whatsapp: "", email: "",
  imovel_id: null as string | null,
  data_entrada: "", data_saida: "", dia_vencimento: 5,
  status: "ativo", observacoes: "",
  valor_caucao: 0, contrato_url: null as string | null, contrato_nome: null as string | null,
};

function InquilinosPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadContrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/contratos/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("anexos").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); e.target.value = ""; return; }
    const { data: pub } = supabase.storage.from("anexos").getPublicUrl(path);
    setForm((f: any) => ({ ...f, contrato_url: pub.publicUrl, contrato_nome: file.name }));
    setUploading(false);
    e.target.value = "";
    toast.success("Contrato anexado!");
  };


  const { data: inquilinos = [] } = useQuery({
    queryKey: ["inquilinos"],
    queryFn: async () => (await supabase.from("inquilinos").select("*, imoveis(nome,valor_aluguel)").order("nome")).data ?? [],
  });
  const { data: imoveis = [] } = useQuery({
    queryKey: ["imoveis-options"],
    queryFn: async () => (await supabase.from("imoveis").select("id,nome,valor_aluguel").order("nome")).data ?? [],
  });
  const { data: pagamentos = [] } = useQuery({
    queryKey: ["pagamentos"],
    queryFn: async () => (await supabase.from("pagamentos").select("id,inquilino_id,mes,ano,status,data_pagamento,data_vencimento")).data ?? [],
  });

  const filtered = inquilinos.filter((i: any) =>
    (statusFilter === "todos" || statusInquilino(i, pagamentos) === statusFilter) &&
    i.nome?.toLowerCase().includes(search.toLowerCase())
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (i: any) => {
    setEditing(i);
    setForm({ ...empty, ...i, data_entrada: i.data_entrada ?? "", data_saida: i.data_saida ?? "" });
    setOpen(true);
  };

  // Sincroniza o status do imóvel: alugado somente enquanto houver inquilino ativo
  const syncImovelStatus = async (imovelId?: string | null) => {
    if (!imovelId) return;
    const { data: ativos } = await supabase
      .from("inquilinos").select("id").eq("imovel_id", imovelId).eq("status", "ativo").limit(1);
    const { data: imovel } = await supabase.from("imoveis").select("status").eq("id", imovelId).single();
    if (imovel?.status === "manutencao") return;
    const novo = (ativos?.length ?? 0) > 0 ? "alugado" : "vago";
    if (imovel?.status !== novo) await supabase.from("imoveis").update({ status: novo }).eq("id", imovelId);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    // Um imóvel não pode ter dois inquilinos ativos ao mesmo tempo
    if (form.imovel_id && form.status === "ativo") {
      let q = supabase.from("inquilinos").select("nome").eq("imovel_id", form.imovel_id).eq("status", "ativo").limit(1);
      if (editing?.id) q = q.neq("id", editing.id);
      const { data: ocupado } = await q;
      if (ocupado && ocupado.length > 0) {
        setBusy(false);
        toast.error(`Este imóvel já está alugado por ${ocupado[0].nome}. Desative o inquilino atual antes de vincular outro.`);
        return;
      }
    }
    const { imoveis: _imoveis, valor_aluguel: _va, ...rest } = form;
    const imovelSelecionado = imoveis.find((im: any) => im.id === form.imovel_id);
    const payload: any = {
      ...rest, user_id: user!.id,
      valor_aluguel: Number(imovelSelecionado?.valor_aluguel ?? 0),
      dia_vencimento: Number(form.dia_vencimento),
      valor_caucao: Number(form.valor_caucao || 0),
      data_entrada: form.data_entrada || null, data_saida: form.data_saida || null,
      imovel_id: form.imovel_id || null,
    };
    const { error } = editing
      ? await supabase.from("inquilinos").update(payload).eq("id", editing.id)
      : await supabase.from("inquilinos").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Inquilino salvo!"); setOpen(false);
      qc.invalidateQueries({ queryKey: ["inquilinos"] });
      await syncImovelStatus(payload.imovel_id);
      if (editing?.imovel_id && editing.imovel_id !== payload.imovel_id) await syncImovelStatus(editing.imovel_id);
      qc.invalidateQueries({ queryKey: ["imoveis"] });
      qc.invalidateQueries({ queryKey: ["imoveis-options"] });
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este inquilino?")) return;
    const alvo = inquilinos.find((i: any) => i.id === id);
    const { error } = await supabase.from("inquilinos").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Excluído");
      qc.invalidateQueries({ queryKey: ["inquilinos"] });
      await syncImovelStatus(alvo?.imovel_id);
      qc.invalidateQueries({ queryKey: ["imoveis"] });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inquilinos</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} inquilinos</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Novo inquilino</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_INQUILINO.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Nome</TableHead><TableHead className="hidden md:table-cell">Telefone</TableHead>
              <TableHead className="hidden md:table-cell">Imóvel</TableHead><TableHead>Valor do imóvel</TableHead><TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum inquilino.</TableCell></TableRow>
                : filtered.map((i: any) => (
                  <TableRow key={i.id}>
                    <TableCell className="font-medium">{i.nome}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{i.telefone}</TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{i.imoveis?.nome ?? "—"}</TableCell>
                    <TableCell className="text-sm">{i.imoveis ? brl(i.imoveis.valor_aluguel) : "—"}</TableCell>
                    <TableCell><StatusBadge status={statusInquilino(i, pagamentos)} /></TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="ghost" size="icon"><Link to="/inquilinos/$id" params={{ id: i.id }}><Eye className="w-4 h-4" /></Link></Button>
                      <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Editar inquilino" : "Novo inquilino"} onSubmit={submit} busy={busy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Nome completo</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div><Label>CPF</Label><Input value={form.cpf} onChange={e => setForm({ ...form, cpf: e.target.value })} /></div>
          <div><Label>RG</Label><Input value={form.rg} onChange={e => setForm({ ...form, rg: e.target.value })} /></div>
          <div><Label>Telefone</Label><Input value={form.telefone} onChange={e => setForm({ ...form, telefone: e.target.value })} /></div>
          <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={e => setForm({ ...form, whatsapp: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>E-mail</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
          
          <div>
            <Label>Imóvel vinculado</Label>
            <Select value={form.imovel_id ?? "none"} onValueChange={v => setForm({ ...form, imovel_id: v === "none" ? null : v })}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum</SelectItem>
                {imoveis.map((im: any) => <SelectItem key={im.id} value={im.id}>{im.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Situação do contrato</Label>
            <Select value={form.status === "inativo" ? "inativo" : "ativo"} onValueChange={v => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">"Em atraso" é identificado automaticamente pelos pagamentos.</p>
          </div>
          <div><Label>Data de entrada</Label><Input type="date" value={form.data_entrada} onChange={e => setForm({ ...form, data_entrada: e.target.value })} /></div>
          <div><Label>Data de saída</Label><Input type="date" value={form.data_saida} onChange={e => setForm({ ...form, data_saida: e.target.value })} /></div>
          <div>
            <Label>Valor do aluguel (do imóvel)</Label>
            <Input readOnly disabled value={brl(imoveis.find((im: any) => im.id === form.imovel_id)?.valor_aluguel ?? 0)} />
          </div>

          <div><Label>Dia de vencimento</Label><Input type="number" min={1} max={31} value={form.dia_vencimento} onChange={e => setForm({ ...form, dia_vencimento: e.target.value })} /></div>
          <div><Label>Valor do caução</Label><Input type="number" step="0.01" value={form.valor_caucao ?? 0} onChange={e => setForm({ ...form, valor_caucao: e.target.value })} /></div>
          <div className="md:col-span-2">
            <Label>Contrato (PDF ou imagem)</Label>
            <div className="flex flex-wrap items-center gap-2">
              <label className="cursor-pointer">
                <input type="file" hidden accept="application/pdf,image/*" onChange={uploadContrato} disabled={uploading} />
                <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Anexar contrato"}
                </span>
              </label>
              {form.contrato_url && (
                <>
                  <a href={form.contrato_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-primary hover:underline truncate max-w-[200px]">
                    <FileText className="w-4 h-4 shrink-0" /> {form.contrato_nome || "Contrato"}
                  </a>
                  <Button type="button" variant="ghost" size="icon" onClick={() => setForm({ ...form, contrato_url: null, contrato_nome: null })}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          </div>
          <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
