import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { brl, MESES, formatDate, cobrancasInquilino, statusPagamento } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";
import { Download } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/relatorios")({ component: Relatorios });

function Relatorios() {
  const [ano, setAno] = useState(String(new Date().getFullYear()));

  const { data } = useQuery({
    queryKey: ["relatorios", ano],
    queryFn: async () => {
      const [pag, des, imv, inq] = await Promise.all([
        supabase.from("pagamentos").select("*, imoveis(nome)").eq("ano", Number(ano)),
        supabase.from("despesas").select("*, imoveis(nome)").eq("ano", Number(ano)),
        supabase.from("imoveis").select("id,nome"),
        supabase.from("inquilinos").select("id,nome,status,imoveis(nome)").eq("status", "atrasado"),
      ]);
      return { pagamentos: pag.data ?? [], despesas: des.data ?? [], imoveis: imv.data ?? [], atrasados: inq.data ?? [] };
    },
  });

  const pagamentos = data?.pagamentos ?? [];
  const despesas = data?.despesas ?? [];
  const imoveis = data?.imoveis ?? [];

  const porMes = MESES.map((m, i) => {
    const mi = i + 1;
    const recebido = pagamentos.filter((p: any) => p.mes === mi && p.status === "pago").reduce((s: number, p: any) => s + Number(p.valor), 0);
    const desp = despesas.filter((d: any) => d.mes === mi).reduce((s: number, d: any) => s + Number(d.valor), 0);
    return { mes: m, recebido, desp, lucro: recebido - desp };
  });

  const porImovel = imoveis.map((im: any) => {
    const receita = pagamentos.filter((p: any) => p.imovel_id === im.id && p.status === "pago").reduce((s: number, p: any) => s + Number(p.valor), 0);
    const desp = despesas.filter((d: any) => d.imovel_id === im.id).reduce((s: number, d: any) => s + Number(d.valor), 0);
    return { nome: im.nome, receita, desp, lucro: receita - desp };
  });

  const totalRecebido = porMes.reduce((s, r) => s + r.recebido, 0);
  const totalDespesas = porMes.reduce((s, r) => s + r.desp, 0);
  const totalLucro = totalRecebido - totalDespesas;

  const exportCSV = (rows: any[], filename: string) => {
    if (!rows.length) { toast.error("Sem dados"); return; }
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const anos = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Relatórios</h1>
        <Select value={ano} onValueChange={setAno}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>{anos.map(a => <SelectItem key={a} value={String(a)}>{a}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Ganho total do ano</p>
          <p className="text-2xl font-bold text-success">{brl(totalRecebido)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Despesas totais do ano</p>
          <p className="text-2xl font-bold text-destructive">{brl(totalDespesas)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-muted-foreground">Lucro total do ano</p>
          <p className="text-2xl font-bold">{brl(totalLucro)}</p>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Receita, despesas e lucro por mês ({ano})</h3>
          <Button variant="outline" size="sm" onClick={() => exportCSV(porMes, `mensal-${ano}.csv`)}><Download className="w-4 h-4" /> CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Mês</TableHead><TableHead>Recebido</TableHead><TableHead>Despesas</TableHead><TableHead>Lucro</TableHead></TableRow></TableHeader>
            <TableBody>
              {porMes.map(r => (
                <TableRow key={r.mes}>
                  <TableCell>{r.mes}</TableCell>
                  <TableCell className="text-success">{brl(r.recebido)}</TableCell>
                  <TableCell className="text-destructive">{brl(r.desp)}</TableCell>
                  <TableCell className="font-semibold">{brl(r.lucro)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold">Por imóvel ({ano})</h3>
          <Button variant="outline" size="sm" onClick={() => exportCSV(porImovel, `imoveis-${ano}.csv`)}><Download className="w-4 h-4" /> CSV</Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Imóvel</TableHead><TableHead>Receita</TableHead><TableHead>Despesas</TableHead><TableHead>Lucro</TableHead></TableRow></TableHeader>
            <TableBody>
              {porImovel.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem dados.</TableCell></TableRow>
                : porImovel.map(r => (
                  <TableRow key={r.nome}>
                    <TableCell className="font-medium">{r.nome}</TableCell>
                    <TableCell className="text-success">{brl(r.receita)}</TableCell>
                    <TableCell className="text-destructive">{brl(r.desp)}</TableCell>
                    <TableCell className="font-semibold">{brl(r.lucro)}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RelatorioInquilino exportCSV={exportCSV} />

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Inquilinos em atraso</h3>
        {(data?.atrasados ?? []).length === 0 ? <p className="text-sm text-muted-foreground">Nenhum em atraso.</p> : (
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Imóvel</TableHead></TableRow></TableHeader>
            <TableBody>
              {(data?.atrasados ?? []).map((a: any) => (
                <TableRow key={a.id}><TableCell>{a.nome}</TableCell><TableCell>{a.imoveis?.nome ?? "—"}</TableCell></TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}

function RelatorioInquilino({ exportCSV }: { exportCSV: (rows: any[], filename: string) => void }) {
  const [inquilinoId, setInquilinoId] = useState<string>("");

  const { data: inquilinos = [] } = useQuery({
    queryKey: ["inquilinos-options"],
    queryFn: async () => (await supabase.from("inquilinos").select("*, imoveis(nome,valor_aluguel)").order("nome")).data ?? [],
  });

  const { data: lancados = [] } = useQuery({
    queryKey: ["relatorio-inquilino", inquilinoId],
    enabled: !!inquilinoId,
    queryFn: async () =>
      (await supabase.from("pagamentos").select("*, imoveis(nome)").eq("inquilino_id", inquilinoId)
        .order("ano", { ascending: false }).order("mes", { ascending: false })).data ?? [],
  });

  const inquilino: any = inquilinos.find((i: any) => i.id === inquilinoId);
  // meses desde a entrada, mesmo os que ainda não foram lançados
  const pagamentos = (inquilino ? cobrancasInquilino(inquilino, lancados) : [])
    .sort((a: any, b: any) => b.ano - a.ano || b.mes - a.mes)
    .map((p: any) => ({ ...p, situacao: statusPagamento(p) }));
  const pagos = pagamentos.filter((p: any) => p.situacao === "pago");
  const pendentes = pagamentos.filter((p: any) => p.situacao !== "pago");
  const totalPago = pagos.reduce((s: number, p: any) => s + Number(p.valor), 0);
  const totalPendente = pendentes.reduce((s: number, p: any) => s + Number(p.valor), 0);

  const rowsCSV = pagamentos.map((p: any) => ({
    mes: MESES[p.mes - 1], ano: p.ano, imovel: p.imoveis?.nome ?? inquilino?.imoveis?.nome ?? "",
    valor: p.valor, vencimento: p.data_vencimento ?? "", pagamento: p.data_pagamento ?? "",
    status: p.situacao, forma_pagamento: p.forma_pagamento ?? "",
  }));

  return (
    <Card className="p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <h3 className="font-semibold">Relatório por inquilino</h3>
        <div className="flex flex-wrap gap-2">
          <Select value={inquilinoId} onValueChange={setInquilinoId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Selecione o inquilino" /></SelectTrigger>
            <SelectContent>
              {inquilinos.map((i: any) => <SelectItem key={i.id} value={i.id}>{i.nome}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" disabled={!inquilinoId}
            onClick={() => exportCSV(rowsCSV, `inquilino-${inquilino?.nome ?? "relatorio"}.csv`)}>
            <Download className="w-4 h-4" /> CSV
          </Button>
        </div>
      </div>

      {!inquilinoId ? <p className="text-sm text-muted-foreground">Selecione um inquilino para ver o histórico completo de pagamentos.</p> : (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Imóvel: {inquilino?.imoveis?.nome ?? "—"} • Pago: <span className="text-success font-semibold">{brl(totalPago)}</span> • Pendente: <span className="text-destructive font-semibold">{brl(totalPendente)}</span>
          </p>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Mês/Ano</TableHead><TableHead>Imóvel</TableHead><TableHead>Vencimento</TableHead>
                <TableHead>Pagamento</TableHead><TableHead>Valor</TableHead><TableHead>Situação</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {pagamentos.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground">Sem meses a cobrar.</TableCell></TableRow>
                  : pagamentos.map((p: any) => (
                    <TableRow key={p.id} className={p.situacao !== "pago" ? "bg-destructive/5" : ""}>
                      <TableCell>{MESES[p.mes - 1]}/{p.ano}</TableCell>
                      <TableCell className="text-sm">{p.imoveis?.nome ?? inquilino?.imoveis?.nome ?? "—"}</TableCell>
                      <TableCell>{formatDate(p.data_vencimento)}</TableCell>
                      <TableCell>{formatDate(p.data_pagamento)}</TableCell>
                      <TableCell>{brl(p.valor)}</TableCell>
                      <TableCell><StatusBadge status={p.situacao} /></TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
          {pendentes.length > 0 && (
            <p className="text-sm">
              <span className="font-semibold text-destructive">Meses pendentes:</span>{" "}
              {pendentes.map((p: any) => `${MESES[p.mes - 1]}/${p.ano}`).join(", ")}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
