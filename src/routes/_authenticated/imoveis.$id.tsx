import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft } from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { brl, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/imoveis/$id")({ component: ImovelDetail });

function ImovelDetail() {
  const { id } = Route.useParams();

  const { data } = useQuery({
    queryKey: ["imovel", id],
    queryFn: async () => {
      const [imovel, inquilinos, pagamentos, despesas] = await Promise.all([
        supabase.from("imoveis").select("*").eq("id", id).single(),
        supabase.from("inquilinos").select("*").eq("imovel_id", id).order("data_entrada", { ascending: false }),
        supabase.from("pagamentos").select("*, inquilinos(nome)").eq("imovel_id", id).order("ano", { ascending: false }).order("mes", { ascending: false }),
        supabase.from("despesas").select("*").eq("imovel_id", id).order("data_despesa", { ascending: false }),
      ]);
      return { imovel: imovel.data, inquilinos: inquilinos.data ?? [], pagamentos: pagamentos.data ?? [], despesas: despesas.data ?? [] };
    },
  });

  if (!data?.imovel) return <p className="text-muted-foreground">Carregando...</p>;
  const { imovel, inquilinos, pagamentos, despesas } = data;
  const inquilinoAtual = inquilinos.find((i: any) => i.status === "ativo");
  const recebido = pagamentos.filter((p: any) => p.status === "pago").reduce((s: number, p: any) => s + Number(p.valor), 0);
  const totalDespesas = despesas.reduce((s: number, d: any) => s + Number(d.valor), 0);

  return (
    <div className="space-y-4">
      <Button asChild variant="ghost" size="sm"><Link to="/imoveis"><ArrowLeft className="w-4 h-4" /> Voltar</Link></Button>

      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">{imovel.nome}</h1>
          <p className="text-sm text-muted-foreground">{imovel.endereco}{imovel.cidade && `, ${imovel.cidade}`}{imovel.estado && ` / ${imovel.estado}`}</p>
        </div>
        <StatusBadge status={inquilinoAtual ? "alugado" : "vago"} />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-muted-foreground">Aluguel padrão</p><p className="text-xl font-bold">{brl(imovel.valor_aluguel)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Total recebido</p><p className="text-xl font-bold text-success">{brl(recebido)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">Lucro líquido</p><p className="text-xl font-bold">{brl(recebido - totalDespesas)}</p></Card>
      </div>

      <Card className="p-4 text-sm flex flex-wrap gap-6">
        <p><span className="text-muted-foreground">Dormitórios:</span> {imovel.dormitorios ?? "—"}</p>
        <p><span className="text-muted-foreground">Metragem:</span> {imovel.metragem ? `${imovel.metragem} m²` : "—"}</p>
      </Card>

      {Array.isArray(imovel.fotos) && imovel.fotos.length > 0 && (
        <Card className="p-3">
          <h3 className="font-semibold mb-2">Fotos</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(imovel.fotos as string[]).map((url) => (
              <a key={url} href={url} target="_blank" rel="noreferrer">
                <img src={url} alt={imovel.nome} className="h-32 w-full rounded object-cover" />
              </a>
            ))}
          </div>
        </Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-2">Inquilino atual</h3>
        {inquilinoAtual ? (
          <div>
            <Link to="/inquilinos/$id" params={{ id: inquilinoAtual.id }} className="text-primary hover:underline font-medium">{inquilinoAtual.nome}</Link>
            <p className="text-sm text-muted-foreground">{inquilinoAtual.telefone} • Entrou em {formatDate(inquilinoAtual.data_entrada)}</p>
          </div>
        ) : <p className="text-sm text-muted-foreground">Nenhum inquilino ativo.</p>}
      </Card>

      {imovel.observacoes && (
        <Card className="p-4"><h3 className="font-semibold mb-1">Observações</h3><p className="text-sm whitespace-pre-wrap">{imovel.observacoes}</p></Card>
      )}

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Histórico de pagamentos</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Mês/Ano</TableHead><TableHead>Inquilino</TableHead><TableHead>Valor</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {pagamentos.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem pagamentos.</TableCell></TableRow>
                : pagamentos.map((p: any) => (
                  <TableRow key={p.id}><TableCell>{p.mes}/{p.ano}</TableCell><TableCell>{p.inquilinos?.nome ?? "—"}</TableCell><TableCell>{brl(p.valor)}</TableCell><TableCell><StatusBadge status={p.status} /></TableCell></TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Card className="p-4">
        <h3 className="font-semibold mb-3">Histórico de despesas</h3>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader><TableRow><TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead>Descrição</TableHead><TableHead>Valor</TableHead></TableRow></TableHeader>
            <TableBody>
              {despesas.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Sem despesas.</TableCell></TableRow>
                : despesas.map((d: any) => (
                  <TableRow key={d.id}><TableCell>{formatDate(d.data_despesa)}</TableCell><TableCell>{d.tipo}</TableCell><TableCell className="text-sm">{d.descricao}</TableCell><TableCell>{brl(d.valor)}</TableCell></TableRow>
                ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
