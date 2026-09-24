import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, Trash2, FileText } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, formatDate } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inquilinos/$id")({ component: InquilinoDetail });

function InquilinoDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const { data } = useQuery({
    queryKey: ["inquilino", id],
    queryFn: async () => {
      const [inq, pag, anx, ctr] = await Promise.all([
        supabase.from("inquilinos").select("*, imoveis(id,nome)").eq("id", id).single(),
        supabase.from("pagamentos").select("*").eq("inquilino_id", id).order("ano", { ascending: false }).order("mes", { ascending: false }),
        supabase.from("anexos").select("*").eq("inquilino_id", id).order("created_at", { ascending: false }),
        supabase.from("contratos").select("*").eq("inquilino_id", id).order("created_at", { ascending: false }),
      ]);
      return { inq: inq.data, pagamentos: pag.data ?? [], anexos: anx.data ?? [], contratos: ctr.data ?? [] };
    },
  });

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const path = `${user.id}/${id}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from("anexos").upload(path, file);
    if (upErr) { toast.error(upErr.message); setUploading(false); return; }
    const { data: pub } = supabase.storage.from("anexos").getPublicUrl(path);
    const { error } = await supabase.from("anexos").insert({
      user_id: user.id, inquilino_id: id,
      imovel_id: data?.inq?.imovel_id ?? null,
      nome: file.name, tipo: file.type, arquivo_url: pub.publicUrl,
    });
    setUploading(false);
    e.target.value = "";
    if (error) toast.error(error.message);
    else { toast.success("Anexo enviado!"); qc.invalidateQueries({ queryKey: ["inquilino", id] }); }
  };

  const removeAnexo = async (anexoId: string) => {
    if (!confirm("Excluir anexo?")) return;
    await supabase.from("anexos").delete().eq("id", anexoId);
    qc.invalidateQueries({ queryKey: ["inquilino", id] });
  };

  if (!data?.inq) return <p className="text-muted-foreground">Carregando...</p>;
  const inq = data.inq;
  const pendencias = data.pagamentos.filter((p: any) => p.status !== "pago").reduce((s: number, p: any) => s + Number(p.valor), 0);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/inquilinos"><ArrowLeft className="w-4 h-4" /> Voltar</Link></Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{inq.nome}</h1>
          <p className="text-sm text-muted-foreground">{inq.email} • {inq.telefone}</p>
        </div>
        <StatusBadge status={inq.status} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4 space-y-1 text-sm">
          <h3 className="font-semibold mb-2">Dados pessoais</h3>
          <p><span className="text-muted-foreground">CPF:</span> {inq.cpf || "—"}</p>
          <p><span className="text-muted-foreground">RG:</span> {inq.rg || "—"}</p>
          <p><span className="text-muted-foreground">WhatsApp:</span> {inq.whatsapp || "—"}</p>
          
        </Card>
        <Card className="p-4 space-y-1 text-sm">
          <h3 className="font-semibold mb-2">Locação</h3>
          <p><span className="text-muted-foreground">Imóvel:</span> {inq.imoveis ? <Link to="/imoveis/$id" params={{ id: inq.imoveis.id }} className="text-primary hover:underline">{inq.imoveis.nome}</Link> : "—"}</p>
          <p><span className="text-muted-foreground">Entrada:</span> {formatDate(inq.data_entrada)}</p>
          <p><span className="text-muted-foreground">Saída:</span> {formatDate(inq.data_saida)}</p>
          <p><span className="text-muted-foreground">Aluguel:</span> {brl(inq.valor_aluguel)}</p>
          <p><span className="text-muted-foreground">Caução:</span> {brl(inq.valor_caucao)}</p>
          <p>
            <span className="text-muted-foreground">Contrato:</span>{" "}
            {inq.contrato_url
              ? <a href={inq.contrato_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">{inq.contrato_nome || "Ver contrato"}</a>
              : "—"}
          </p>
          <p><span className="text-muted-foreground">Pendências:</span> <span className="font-semibold text-destructive">{brl(pendencias)}</span></p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Anexos e documentos</h3>
          <label className="cursor-pointer">
            <input type="file" hidden onChange={upload} disabled={uploading} />
            <span className="inline-flex items-center gap-2 rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground hover:bg-primary/90">
              <Upload className="w-4 h-4" /> {uploading ? "Enviando..." : "Enviar arquivo"}
            </span>
          </label>
        </div>
        {data.anexos.length === 0 ? <p className="text-sm text-muted-foreground">Nenhum anexo.</p> : (
          <ul className="space-y-2">
            {data.anexos.map((a: any) => (
              <li key={a.id} className="flex items-center justify-between border rounded p-2">
                <a href={a.arquivo_url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline truncate">
                  <FileText className="w-4 h-4 shrink-0" /> <span className="truncate">{a.nome}</span>
                </a>
                <Button variant="ghost" size="icon" onClick={() => removeAnexo(a.id)}><Trash2 className="w-4 h-4 text-destructive" /></Button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Histórico de pagamentos</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Mês/Ano</TableHead><TableHead>Vencimento</TableHead><TableHead>Pagamento</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.pagamentos.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem pagamentos.</TableCell></TableRow>
                : data.pagamentos.map((p: any) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.mes}/{p.ano}</TableCell>
                    <TableCell>{formatDate(p.data_vencimento)}</TableCell>
                    <TableCell>{formatDate(p.data_pagamento)}</TableCell>
                    <TableCell>{brl(p.valor)}</TableCell>
                    <TableCell><StatusBadge status={p.status} /></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {inq.observacoes && <Card className="p-4"><h3 className="font-semibold mb-1">Observações</h3><p className="text-sm whitespace-pre-wrap">{inq.observacoes}</p></Card>}
    </div>
  );
}
