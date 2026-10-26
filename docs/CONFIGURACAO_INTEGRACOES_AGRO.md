# Configuração das integrações AgroGestão

As alterações de código não contratam serviços, não instalam modelos de IA e não iniciam cobranças. Disponibilize variáveis ao processo Java pelo mecanismo de execução existente. Um `.env` não é carregado automaticamente pelo Spring.

## Banco e início local

Backend: Java 21 ou compatível, MySQL conforme a configuração existente, Flyway ativo. As migrations V35–V40 são aditivas. Faça primeiro um ensaio em cópia de desenvolvimento do banco, preservando os dados e as migrations anteriores. Não usar `ddl-auto=create` em banco com dados: a aplicação mantém `validate` em sua configuração normal.

Frontend: na pasta `apps/fluxo-caixa-web`, executar `npm run dev`. A rota integrada é `/dashboard/agricola`; login e cadastro usam as cenas agrícolas locais. Não há publicação automática.

## Cotações

```dotenv
AGRO_COTACOES_URL=
AGRO_COTACOES_TOKEN=
AGRO_COTACOES_AUTOMATICO=false
```

O operador deve escolher um provedor com autorização de uso dos dados. A URL deve ser HTTPS; HTTP só é aceito em loopback para desenvolvimento/teste. O token é enviado no cabeçalho `Authorization: Bearer`, somente pelo backend. Não inclua credenciais na URL.

O adaptador espera uma lista JSON de até 1.000 objetos, até 512 KB no total, com estas chaves:

```json
[
  {
    "cultura": "nome da cultura",
    "praca": "praça de comercialização",
    "unidade": "unidade do preço",
    "valor": 1.00,
    "data": "2026-01-01",
    "fonte": "identificação verificável da fonte"
  }
]
```

O valor acima é apenas exemplo de formato técnico, não uma cotação de mercado. Todos os valores são em reais. Um provedor com outro formato precisa de adaptação na origem ou de um adaptador específico; este contrato não significa compatibilidade direta com qualquer API comercial.

Na tela, **Sincronizar com provedor** importa as informações configuradas. O cache evita baixar o mesmo lote por uma hora. O histórico preserva a primeira cotação de uma mesma fonte/cultura/praça/unidade/data; reenvios não duplicam registros.

Somente ao configurar `AGRO_COTACOES_AUTOMATICO=true` a rotina periódica passa a importar o lote para as empresas ativas. O intervalo padrão é uma hora. A disponibilidade real depende do fornecedor; nenhum fornecedor pago foi contratado ou consultado nesta execução. O protocolo, cache e deduplicação são verificados com servidor local de teste.

## Clima

```dotenv
AGRO_CLIMA_USER_AGENT=dominio-real-da-empresa contato-real@dominio-real-da-empresa
```

Cadastre latitude e longitude da propriedade. A consulta envia as coordenadas ao MET Norway, usando HTTPS e cache conforme o cabeçalho `Expires`. O frontend exibe atribuição e licença. Sem identificação configurada, a tela informa a pendência e não inventa previsão. Os avisos de temperatura e chuva são calculados pelo AgroGestão; não são boletins oficiais de defesa civil.

## OCR e IA

```dotenv
AGRO_OCR_TESSERACT=
AGRO_OCR_PDFTOTEXT=
AGRO_OCR_PDFTOPPM=
AGRO_IA_MODELO=
AGRO_IA_URL=http://127.0.0.1:11434
```

Configure os caminhos dos executáveis Tesseract, com idioma `por`, pdftotext e pdftoppm, do Poppler. O primeiro lê JPEG/PNG; o segundo extrai texto de PDFs textuais. Quando um PDF não contém texto, pdftoppm converte até três páginas em imagens para o Tesseract. A extração é limitada a 12.000 caracteres e sempre exige conferência do original. Sem os executáveis, permanece disponível a conferência manual; não foi homologada a precisão em romaneios reais.

Para IA, instale e escolha um modelo local compatível no Ollama. Imagens exigem um modelo com visão. O adaptador usa `/api/generate`, JSON estruturado, timeout e destino loopback. Nomes de modelo contendo `cloud` são rejeitados. Mantenha o servidor Ollama sem recursos de nuvem habilitados. A integração não baixa modelos nem transmite documentos a serviços externos pagos.

Todas as sugestões continuam pendentes de conferência. A cultura pode sugerir uma safra quando houver uma única correspondência; o usuário precisa conferir propriedade, produtor, pesos, descontos e safra. A validação do romaneio cria a colheita e impede nova confirmação daquele registro. Informe a tara separadamente; use zero se o peso já representar somente o produto. O cálculo é (peso bruto − tara) × (1 − impurezas/100) − outros descontos em kg.

## Permissões

Na gestão agrícola, proprietários/administradores podem carregar os usuários e configurar leitura/escrita de produção, estoque, contratos, frota, financeiro, documentos, clima e cotações, além de selecionar propriedades permitidas. Controles existentes são preservados enquanto não houver regra específica. Regras administrativas não podem ser reduzidas nessa tela.

Perfis restritos visualizam somente os registros agrícolas das propriedades liberadas. Relatórios financeiros gerais, extratos gerais e carteira contábil são bloqueados para evitar exposição de outras propriedades. Estoque de insumos e cotações são recursos compartilhados da empresa e dependem da respectiva autorização funcional. Uma permissão de registrar produção ou usar máquina não concede automaticamente permissão de criar movimentos financeiros.

Romaneios novos devem identificar a propriedade na tela. Documentos antigos sem propriedade não são liberados automaticamente para perfis restritos. O download do original utiliza a rota agrícola autenticada e valida o mesmo escopo.

## Asaas e fiscal

Preserve as chaves, planos, preços e ambiente existentes. `ASAAS_WEBHOOK_TOKEN` precisa coincidir com o painel Asaas. Sem token configurado, o endpoint rejeita eventos. Nenhuma alteração implementada realiza pagamento bancário: as confirmações financeiras criam registros de gestão no sistema.

A integração de notas Asaas existente refere-se ao serviço SaaS. Emissão fiscal agrícola em SEFAZ exige certificado, credenciais, regras fiscais e homologação específicos; ela não deve ser considerada configurada por estas alterações.
