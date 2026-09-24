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
import { Pencil, Trash2, Eye, Plus, Search, Upload, X } from "lucide-react";
import { FormDialog } from "@/components/FormDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { brl } from "@/lib/format";
import { STATUS_IMOVEL } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/imoveis")({ component: ImoveisPage });

const empty = {
  nome: "", endereco: "", bairro: "", cidade: "", estado: "",
  valor_aluguel: 0, status: "vago", observacoes: "",
  dormitorios: "", metragem: "", fotos: [] as string[],
};

function ImoveisPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length || !user) return;
    setUploading(true);
    const urls: string[] = [];
    for (const file of files) {
      const safe = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `${user.id}/imoveis/${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${safe}`;
      const { error: upErr } = await supabase.storage
        .from("anexos")
        .upload(path, file, { cacheControl: "3600", upsert: false, contentType: file.type || "image/jpeg" });
      if (upErr) { toast.error(`Erro ao enviar ${file.name}: ${upErr.message}`); continue; }
      urls.push(supabase.storage.from("anexos").getPublicUrl(path).data.publicUrl);
    }
    setForm((f: any) => ({ ...f, fotos: [...(f.fotos ?? []), ...urls] }));
    setUploading(false);
    e.target.value = "";
    if (urls.length) toast.success("Fotos anexadas!");
  };


  const { data: imoveis = [] } = useQuery({
    queryKey: ["imoveis"],
    queryFn: async () => (await supabase.from("imoveis").select("*, inquilinos(id,nome,status)").order("nome")).data ?? [],
  });

  const statusDe = (i: any) => ((i.inquilinos ?? []).some((q: any) => q.status === "ativo") ? "alugado" : "vago");

  const filtered = imoveis.filter((i: any) =>
    (statusFilter === "todos" || statusDe(i) === statusFilter) &&
    (i.nome?.toLowerCase().includes(search.toLowerCase()) ||
     i.endereco?.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => { setEditing(null); setForm(empty); setOpen(true); };
  const openEdit = (i: any) => {
    const { inquilinos: _inq, ...rest } = i;
    setEditing(i);
    setForm({ ...empty, ...rest, dormitorios: rest.dormitorios ?? "", metragem: rest.metragem ?? "", fotos: Array.isArray(rest.fotos) ? rest.fotos : [] });
    setOpen(true);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { inquilinos: _inq, ...rest } = form;
    const payload = {
      ...rest, user_id: user!.id, valor_aluguel: Number(form.valor_aluguel),
      dormitorios: form.dormitorios === "" || form.dormitorios === null ? null : Number(form.dormitorios),
      metragem: form.metragem === "" || form.metragem === null ? null : Number(form.metragem),
      fotos: form.fotos ?? [],
      status: (editing?.inquilinos ?? []).some((q: any) => q.status === "ativo") ? "alugado" : "vago",
    };
    const { error } = editing
      ? await supabase.from("imoveis").update(payload).eq("id", editing.id)
      : await supabase.from("imoveis").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Imóvel salvo!"); setOpen(false); qc.invalidateQueries({ queryKey: ["imoveis"] }); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este imóvel?")) return;
    const { error } = await supabase.from("imoveis").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Excluído"); qc.invalidateQueries({ queryKey: ["imoveis"] }); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Imóveis</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} imóveis encontrados</p>
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4" /> Novo imóvel</Button>
      </div>

      <Card className="p-4">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar por nome ou endereço..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              {STATUS_IMOVEL.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead className="hidden md:table-cell">Endereço</TableHead>
                <TableHead>Inquilino</TableHead>
                <TableHead>Aluguel</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum imóvel cadastrado.</TableCell></TableRow>
              ) : filtered.map((i: any) => (
                <TableRow key={i.id}>
                  <TableCell className="font-medium">{i.nome}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{i.endereco}{i.cidade && `, ${i.cidade}`}</TableCell>
                  <TableCell className="text-sm">{(i.inquilinos ?? []).find((q: any) => q.status === "ativo")?.nome ?? "—"}</TableCell>
                  <TableCell>{brl(i.valor_aluguel)}</TableCell>
                  <TableCell><StatusBadge status={(i.inquilinos ?? []).some((q: any) => q.status === "ativo") ? "alugado" : "vago"} /></TableCell>
                  <TableCell className="text-right">
                    <Button asChild variant="ghost" size="icon"><Link to="/imoveis/$id" params={{ id: i.id }}><Eye className="w-4 h-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(i)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => remove(i.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <FormDialog open={open} onOpenChange={setOpen} title={editing ? "Editar imóvel" : "Novo imóvel"} onSubmit={submit} busy={busy}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="md:col-span-2"><Label>Nome / Código</Label><Input required value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} /></div>
          <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.endereco} onChange={e => setForm({ ...form, endereco: e.target.value })} /></div>
          <div><Label>Bairro</Label><Input value={form.bairro} onChange={e => setForm({ ...form, bairro: e.target.value })} /></div>
          <div><Label>Cidade</Label><Input value={form.cidade} onChange={e => setForm({ ...form, cidade: e.target.value })} /></div>
          <div><Label>Estado</Label><Input maxLength={2} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value.toUpperCase() })} /></div>
          <div><Label>Valor do aluguel</Label><Input type="number" step="0.01" value={form.valor_aluguel} onChange={e => setForm({ ...form, valor_aluguel: e.target.value })} /></div>
          <div><Label>Dormitórios</Label><Input type="number" min={0} value={form.dormitorios} onChange={e => setForm({ ...form, dormitorios: e.target.value })} /></div>
          <div><Label>Metragem (m²)</Label><Input type="number" step="0.01" min={0} value={form.metragem} onChange={e => setForm({ ...form, metragem: e.target.value })} /></div>

          <div className="md:col-span-2 rounded-lg border p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <Label className="mb-0">Fotos do imóvel</Label>
                <p className="text-xs text-muted-foreground">{(form.fotos ?? []).length} foto(s) anexada(s)</p>
              </div>
              <label className="cursor-pointer">
                <input type="file" hidden multiple accept="image/*" onChange={uploadFotos} disabled={uploading} />
                <span className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-accent">
                  <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Anexar fotos"}
                </span>
              </label>
            </div>
            {(form.fotos ?? []).length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(form.fotos as string[]).map((url) => (
                  <div key={url} className="relative group">
                    <img src={url} alt="Foto do imóvel" className="h-20 w-full rounded object-cover border" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, fotos: (form.fotos as string[]).filter(u => u !== url) })}
                      className="absolute -top-1 -right-1 rounded-full bg-destructive text-destructive-foreground p-1 shadow"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>


          <div className="md:col-span-2"><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
        </div>
      </FormDialog>
    </div>
  );
}
