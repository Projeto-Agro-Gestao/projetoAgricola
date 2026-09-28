# AgroGestao

Plataforma de gestao financeira rural para produtores, administradores e contadores especializados no agro.

## Visao colaborativa produtor-contador

O AgroGestao foi ampliado para funcionar como uma ponte operacional entre o produtor rural e o contador. A ideia central e manter a operacao simples para quem esta no campo e oferecer uma visao mais organizada para quem precisa conferir documentos, classificacoes, pendencias e dados fiscais.

## Perfis

- `PRODUTOR`: usa telas simples para acompanhar resultado do mes, enviar documentos, responder pendencias e organizar propriedades/atividades.
- `CONTADOR`: acessa carteira de clientes vinculados, pendencias, documentos, classificacoes e visao tributaria resumida.
- `ADMINISTRADOR` e `SUPER_ADMIN`: preservam acesso administrativo e podem visualizar a carteira de clientes.
- `PROPRIETARIO` e demais perfis existentes continuam compativeis com os fluxos financeiros atuais.

## Fluxo do produtor

O produtor pode:

- ver receitas, despesas, resultado do mes e pendencias abertas;
- lancar receitas e despesas pelos modulos financeiros existentes;
- enviar documentos para o contador, como nota fiscal, XML, comprovante ou recibo;
- cadastrar propriedades rurais;
- cadastrar atividades rurais;
- acompanhar pendencias solicitadas pelo contador.

## Fluxo do contador

O contador pode:

- visualizar a carteira de produtores vinculados;
- identificar clientes com pendencias;
- ver documentos enviados;
- acompanhar movimentacoes sem classificacao;
- consultar uma visao tributaria gerencial;
- filtrar clientes por pendencia, documento ausente ou classificacao pendente.

## Documentos e pendencias

Documentos enviados ficam associados a uma empresa e podem, quando informado, ser ligados a uma movimentacao financeira. Pendencias registram solicitacoes, prazos, prioridade, status e mensagens contextuais.

## Rateio

O sistema possui estrutura para ratear movimentacoes entre propriedades ou descricoes livres. O rateio percentual deve fechar exatamente 100%.

## Visao tributaria

A visao tributaria apresenta estimativas de receitas, despesas, resultado anual e projecao ate o fim do ano. Ela serve como apoio gerencial e nao substitui a validacao fiscal do contador responsavel.

## Exportacoes

O modulo colaborativo disponibiliza exportacao CSV de movimentacoes por periodo. A estrutura foi preparada para evoluir futuramente para LCDPR, integracoes contabeis e exportadores especificos.

## Seguranca

O backend valida acesso por empresa e por vinculo contador-cliente. Empresas nao podem acessar dados umas das outras, e contadores acessam apenas empresas vinculadas ou liberadas por perfil administrativo.

## Fast follow preparado

A arquitetura deixa caminho para evoluir:

- PWA/offline completo;
- regras de classificacao com IA;
- exportacao TXT LCDPR;
- integracoes com sistemas contabeis;
- planos B2B2C por carteira de clientes.
