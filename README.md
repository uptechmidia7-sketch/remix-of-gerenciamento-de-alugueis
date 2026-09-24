# Casa Certa

Crie um sistema web completo para gerenciamento de aluguel de casas.

O sistema deve ser moderno, responsivo, fácil de usar no computador e no celular, com visual profissional, limpo e organizado.

Nome do sistema: Gestão de Aluguéis

Objetivo:
Criar uma plataforma para eu gerenciar meus imóveis alugados, meus inquilinos, contratos, pagamentos mensais, despesas das casas e relatórios financeiros.

Funcionalidades principais:

Dashboard principal

Criar uma tela inicial com cards e gráficos mostrando:

Total recebido no mês

Total de despesas do mês

Lucro líquido do mês

Quantidade de imóveis cadastrados

Quantidade de imóveis alugados

Quantidade de imóveis vagos

Quantidade de pagamentos pendentes

Quantidade de pagamentos atrasados

Receita total por mês

Despesas por mês

Lucro por mês

Lista dos próximos vencimentos de aluguel

Lista dos aluguéis atrasados

O cálculo deve ser:
Lucro líquido = total recebido em aluguéis - total de despesas.

Cadastro de imóveis

Criar uma área para cadastrar casas/imóveis com os seguintes campos:

Nome do imóvel ou código, exemplo: Casa 01

Endereço completo

Bairro

Cidade

Estado

Valor padrão do aluguel

Dia de vencimento do aluguel

Status do imóvel: alugado, vago ou em manutenção

Observações

Foto do imóvel, se possível

Cada imóvel deve ter uma página individual mostrando:

Dados do imóvel

Inquilino atual

Histórico de pagamentos

Histórico de despesas

Lucro gerado por esse imóvel

Cadastro de inquilinos

Criar uma área para cadastrar os inquilinos com os seguintes campos:

Nome completo

CPF

RG

Telefone

WhatsApp

E-mail

Endereço anterior ou atual

Imóvel vinculado

Data de entrada

Data de saída, se houver

Valor do aluguel combinado

Dia de vencimento

Status do inquilino: ativo, inativo, atrasado

Observações

Cada inquilino deve ter uma página individual mostrando:

Dados pessoais

Imóvel alugado

Contrato anexado

Histórico de pagamentos

Pendências financeiras

Observações

Contratos e anexos

No cadastro do inquilino, permitir anexar arquivos, principalmente:

Contrato de aluguel em PDF

Documentos pessoais

Comprovantes

Outros arquivos

Criar campos para:

Data de início do contrato

Data de fim do contrato

Valor do aluguel

Valor do caução, se houver

Observações do contrato

O sistema deve mostrar alerta quando um contrato estiver perto de vencer.

Controle de pagamentos

Criar uma tela de pagamentos mensais.

Campos necessários:

Mês de referência

Ano

Imóvel

Inquilino

Valor do aluguel

Data de vencimento

Data de pagamento

Status do pagamento: pago, pendente ou atrasado

Forma de pagamento: Pix, dinheiro, transferência, boleto ou outro

Observações

Anexo de comprovante, se possível

O sistema deve permitir marcar se o inquilino pagou ou não o aluguel do mês.

Também deve permitir filtrar pagamentos por:

Mês

Ano

Imóvel

Inquilino

Status: pago, pendente ou atrasado

Os pagamentos atrasados devem ficar destacados visualmente.

Controle de despesas

Criar uma tela para lançar despesas das casas por mês.

Campos necessários:

Mês de referência

Ano

Imóvel

Tipo de despesa

Valor

Data da despesa

Descrição

Forma de pagamento

Anexo de comprovante, se possível

Tipos de despesa:

Manutenção

Reforma

Pintura

Água

Luz

IPTU

Condomínio

Taxas

Material de construção

Mão de obra

Outros

Cada despesa deve ser vinculada a um imóvel específico.

Relatórios

Criar uma área de relatórios com filtros por mês, ano e imóvel.

Relatórios desejados:

Total recebido por mês

Total de despesas por mês

Lucro líquido por mês

Receita por imóvel

Despesas por imóvel

Inquilinos em atraso

Histórico financeiro de cada imóvel

Comparativo entre meses

Lista de contratos próximos do vencimento

Permitir exportar os relatórios em PDF ou Excel, se possível.

Regras importantes

Quando um pagamento estiver marcado como “pago”, ele deve entrar no total recebido.

Quando uma despesa for lançada, ela deve entrar no total de despesas.

O dashboard deve atualizar automaticamente conforme pagamentos e despesas forem cadastrados.

O sistema deve permitir editar e excluir cadastros.

O sistema deve ter busca por nome do inquilino, imóvel ou status.

O sistema deve ter layout simples, bonito e profissional.

Banco de dados

Estruture o banco de dados com pelo menos estas tabelas:

usuarios

imoveis

inquilinos

contratos

pagamentos

despesas

anexos

Relacionamentos:

Um imóvel pode ter um inquilino ativo.

Um inquilino pertence a um imóvel.

Um inquilino pode ter um contrato.

Um imóvel pode ter várias despesas.

Um inquilino pode ter vários pagamentos mensais.

Cada pagamento deve estar ligado a um imóvel e a um inquilino.

Cada despesa deve estar ligada a um imóvel.

Login

Criar sistema de login para o administrador acessar o painel.

O administrador deve conseguir:

Cadastrar imóveis

Cadastrar inquilinos

Anexar contratos

Confirmar pagamentos

Lançar despesas

Ver relatórios

Ver dashboard

Design

Usar um design moderno, com:

Menu lateral

Cards no dashboard

Tabelas organizadas

Botões claros de adicionar, editar, excluir e visualizar

Cores profissionais

Layout responsivo para celular

Ícones para facilitar a navegação

Telas principais do sistema:

Login

Dashboard

Imóveis

Cadastro de imóvel

Detalhes do imóvel

Inquilinos

Cadastro de inquilino

Detalhes do inquilino

Pagamentos

Despesas

Contratos

Relatórios

Configurações

Crie o sistema completo com dados de exemplo para teste. Revise todo o sistema, corrija erros de funcionamento e garanta que:

Os pagamentos pagos entrem corretamente no total recebido

As despesas entrem corretamente no total de despesas

O lucro líquido seja calculado corretamente

Os filtros por mês, ano, imóvel e inquilino funcionem

Os anexos sejam salvos corretamente

O dashboard atualize automaticamente

O layout funcione bem no celular

As páginas de cadastro, edição e exclusão estejam funcionando

O sistema esteja pronto para uso real

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://simaoimoveis.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/45f79285-e5ce-4e3f-9f6e-8294cd0d8915).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
