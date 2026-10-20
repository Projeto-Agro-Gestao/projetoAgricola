> Integração no repositório em 19/10/2026: este relatório registra a implementação na cópia inicial. Para a adaptação à versão atual do GitHub e os resultados finais desta branch, consulte ENVIO_REPOSITORIO_2026-10-19.md. As migrations foram renumeradas para V35–V40, preservando V1–V34 existentes.

# AgroGestão — relatório de auditoria e implementação

Data: 19/10/2026. Atualizado após a retomada do desenvolvimento.

## Resultado e limites da entrega

Foram implementados e conectados os registros de safra, colheita, armazenagem física, entregas contratuais, recebimentos, comissões, uso de máquinas, combustível e indicadores financeiros. A integração foi exercitada com Spring, JPA, JDBC e banco H2 isolado, incluindo rollback entre os serviços, sem simular o serviço financeiro nesse teste.

Isso não equivale a homologação de produção: não houve deploy, aplicação de migrations no banco existente, uso de credenciais reais de clientes nem cobrança/pagamento externo. O ensaio de upgrade em cópia MySQL e a ativação dos provedores continuam necessários. Não declarar integrações externas ativas apenas porque o adaptador está implementado.

O relatório da primeira entrega foi preservado em `.codex-backups/agro-auditoria-2026-10-19/RELATORIO_PRIMEIRA_ENTREGA.md`.

## Arquitetura e funcionalidades preservadas

- React 19, React Router e Vite 8 no frontend.
- Java 21 compatível, Spring Boot 4, Spring Security/JWT, JPA, MySQL e Flyway no backend.
- Contas a pagar/receber, liquidações, receitas/despesas, categorias, fornecedores, dashboard e relatórios financeiros existentes.
- Propriedades, atividades rurais, documentos, pendências, rateios e colaboração produtor–contador.
- Administração, assinaturas mensais/anuais, preços configurados, pagamentos e notas do serviço Asaas. Os valores comerciais não foram alterados.
- Arquivos de banco, pastas antigas e funcionalidades anteriores foram preservados. O diretório raiz não é um repositório Git; não foi gerado commit ou PR.

## Funcionalidades implementadas e integração

| Funcionalidade | Comportamento entregue |
|---|---|
| Safras e talhões | Cadastro por propriedade, cultura, área e período; controle de empresa, área e datas |
| Produção | Operações de plantio, colheita, insumos, máquinas, combustível, armazenagem e outras; produção líquida e produtividade por hectare |
| Centros de custo agrícolas | Lançamentos associados a propriedade, talhão e safra; custos/ha, receitas e resultado utilizam os vínculos reais |
| Romaneio | PDF/JPEG/PNG até 10 MB; histórico, original disponível para download autenticado, SHA-256 por empresa, conferência antes de gerar colheita e impedimento de validar o mesmo registro duas vezes |
| OCR e IA | Tesseract para imagens, pdftotext para PDF textual e pdftoppm + Tesseract para até três páginas escaneadas; adaptador Ollama exclusivamente local; sugestões persistidas e revisáveis |
| Associação de romaneio | Propriedade indicada na importação; validação impede safra de outra propriedade; cultura com correspondência única pode sugerir a safra; a confirmação cria a operação e pode vincular o documento ao financeiro |
| Estoque de insumos | Sementes, defensivos, fertilizantes, combustível e outros; unidade, entradas, aplicações/saídas vinculadas a operação; saldo insuficiente é rejeitado |
| Silos/armazéns | Cadastro por propriedade, capacidade, depósitos vinculados à colheita, saldo por safra e histórico físico; depósitos não podem superar produção disponível ou capacidade, inclusive em datas retroativas |
| Contratos e entregas | Contrato por safra, contraparte, quantidade, preço e comissão; entrega reduz saldo do contrato e estoque físico da safra; quantidade indisponível é rejeitada |
| Recebimentos e comissões | Confirmação de valores efetivamente recebidos/pagos cria os lançamentos no financeiro e os associa à safra; reenvio não cria novos lançamentos; registros na lixeira são identificados para revisão |
| Frota e manutenção | Máquinas por propriedade, identificação, horímetro e manutenção por horas; uso/manutenção vinculados a operação; atualização do horímetro e do próximo limite de manutenção |
| Combustível e custos de máquinas | Consumo em litros descontado do estoque; despesa opcional efetivamente paga entra no financeiro e nos custos da safra, na mesma transação |
| Conciliação bancária | CSV normalizado e OFX de uma conta, até 500 lançamentos; deduplicação por conta/referência; associação confirmada com movimentação de empresa, data, valor e tipo compatíveis |
| Cotações | Histórico de culturas, praça, unidade, preço em reais, data e fonte; gráfico por série; sincronização com provedor configurado, cache e rotina automática opcional |
| Clima | Coordenadas por propriedade, adaptador MET Norway, cache conforme Expires, temperatura/chuva/umidade e avisos calculados de frio/calor/chuva intensa |
| Permissões | Regras de leitura/escrita por funcionalidade e escopo por propriedade, administradas na interface; direitos administrativos preservados; configuração auditada |
| Isolamento | Registros agrícolas filtrados por propriedade autorizada; movimentos financeiros exigem permissão financeira adicional; perfis restritos não acessam relatórios gerais, extratos gerais ou carteira que poderiam expor outras propriedades |
| Login/cadastro | Painel central com contraste e transparência, fundo em vídeo, MP4s de trigo/milho/soja, variantes móveis, posters licenciados, autoplay silencioso em loop e fallback por erro, movimento reduzido ou economia de dados |

Estoque de insumos e cotações são recursos compartilhados da empresa, sujeitos à permissão funcional; não foram apresentados como estoques exclusivos de uma propriedade.

A umidade é uma medição. O sistema não inventa tabelas comerciais de desconto: o peso líquido retira primeiro a tara, depois desconta impurezas percentuais e descontos em kg conferidos pelo usuário. A colheita não presume receita recebida e o contrato não presume pagamento.

## Correções

- Webhook Asaas rejeita eventos se o token estiver vazio ou incorreto.
- Login também direciona SUPER_ADMIN à administração.
- Cadastro impede nova criação quando a conta já foi criada e apenas o login automático falhou.
- CSV de colaboração neutraliza conteúdo que poderia iniciar fórmulas em planilhas.
- Upload tem limite efetivo de 10 MB e resposta clara para arquivo excedido; duplicidades retornam HTTP 409.
- Referências estrangeiras de empresa/propriedade são rejeitadas antes das gravações.
- Tara retirada antes das impurezas, evitando descontar percentual sobre o peso do veículo; teste específico e cenário integrado com tara não nula.
- Conciliação não cria receita/despesa nova a partir do extrato; OFX incompleto ou com múltiplas contas é rejeitado para evitar omissões e associação incorreta.
- Integração entre serviços usa métodos de acesso compatíveis com proxies transacionais do Spring; falha descoberta e corrigida pelo teste integrado.
- Auditoria JDBC informa timestamp explicitamente, funcionando também com schema criado por JPA.
- Mockito é carregado como agente de testes para evitar falha de autoanexação no JDK 24 do ambiente.

## Banco e compatibilidade

Migrations aditivas:

- V35: safras, operações e romaneios.
- V36: coordenadas e cotações.
- V37: insumos/estoque, contratos e extratos.
- V38: vínculo financeiro unificado por safra, silos, grãos, entregas, máquinas e usos. A migration incorpora os vínculos financeiros já existentes das operações.
- V39: permissões por usuário/função/propriedade e propriedade opcional nos romaneios existentes.
- V40: tara do romaneio, inicialmente zero nos registros antigos, com validação de limites.

As migrations anteriores não foram editadas. Documentos antigos sem propriedade não são automaticamente liberados para perfis restritos. As novas migrations foram testadas em banco isolado; ainda é necessário ensaiar o upgrade em uma cópia MySQL antes de usar o banco real. A configuração normal continua com Hibernate em modo validate.

## APIs, dependências e configuração

Rotas internas em `/api/v1/empresas/{empresaId}/agricola`: safras, operações, romaneios/originais, insumos, estoque, armazéns, depósitos, grãos, contratos, entregas/liquidações, máquinas/usos, extratos/OFX/conciliação, cotações/sincronização, clima/localização e acessos.

- MET Norway: https://api.met.no/doc/ForecastJSON e https://api.met.no/doc/TermsOfService — identificação real do operador e atribuição na interface.
- Ollama: https://docs.ollama.com/api/generate — modelo local já instalado; sem contratação de serviço ou download automático de modelo.
- Provedor de cotações: adaptador JSON normalizado, URL HTTPS e token opcionais; nenhum fornecedor pago foi contratado. Automação fica desativada por padrão.
- Asaas existente preservado; nenhuma chamada de cobrança ou pagamento real foi executada.
- Tesseract com idioma por, pdftotext e pdftoppm opcionais para OCR local.
- H2 adicionado apenas aos testes; produção permanece MySQL.
- imageio-ffmpeg usado na conversão dos vídeos, sem dependência no runtime do sistema.

Instruções e contrato técnico do provedor: `CONFIGURACAO_INTEGRACOES_AGRO.md`.

Origem comercial dos vídeos, autores e alterações: `fluxo-caixa-web/public/media/LICENCAS.md`. Fontes Pexels:

- Trigo: https://www.pexels.com/video/combine-harvester-drone-footage-13505288/
- Milho: https://www.pexels.com/video/tractors-harvesting-a-corn-field-9408335/
- Soja: https://www.pexels.com/video/aerial-view-of-soybean-harvest-in-progress-32129340/
- Licença: https://www.pexels.com/license/

Somente uma cena é carregada por montagem da tela; não se faz download antecipado do acervo inteiro. Os originais permanecem fora da pasta pública. Hashes dos MP4s e posters em `public/media/SHA256SUMS.txt`.

## Arquivos criados

Backend: `fluxo-caixa-api/src/main/java/br/com/fluxocaixa/agricola/`:

- AgricolaController.java, AgricolaService.java, PesoRomaneio.java, ExtratorRomaneio.java.
- ClimaController.java, CotacoesController.java, RecursosAgroController.java.
- ProducaoIntegradaController.java, ProducaoIntegradaService.java, ExtratoOfxParser.java.
- PermissoesAgroService.java, PermissoesAgroController.java, AgroPermissoesWebConfig.java.
- CotacoesImportacaoService.java, CotacoesIntegracaoController.java, AgroAgendamentosConfig.java.

Migrations em `fluxo-caixa-api/src/main/resources/db/migration/`:

- V35__gestao_producao_e_romaneios.sql.
- V36__localizacao_e_cotacoes_agricolas.sql.
- V37__estoque_contratos_conciliacao.sql.
- V38__integrar_armazenagem_entregas_e_frota.sql.
- V39__permissoes_agro_por_funcao_e_propriedade.sql.
- V40__registrar_tara_romaneio.sql.

Testes em `fluxo-caixa-api/src/test/java/br/com/fluxocaixa/agricola/`:

- AgricolaServiceTest.java, ExtratorRomaneioTest.java, ProducaoIntegradaContextTest.java.

Frontend:

- `src/paginas/GestaoAgricola.jsx` e `.css`.
- `src/componentes/FundoAutenticacao.jsx`, ClimaCotacoes.jsx, RecursosAgro.jsx, ProducaoIntegrada.jsx e PermissoesAgro.jsx.
- `public/media/colheita-{trigo,milho,soja}.mp4`, respectivas variantes `-mobile.mp4`, posters `.jpg`, LICENCAS.md e SHA256SUMS.txt.

Documentação: este relatório e CONFIGURACAO_INTEGRACOES_AGRO.md.

## Arquivos modificados

- Backend: pom.xml, .env.example e src/main/resources/application.properties.
- AsaasWebhookService.java, ColaboracaoService.java, ColaboracaoController.java e ManipuladorGlobalDeErros.java.
- AsaasWebhookServiceTest.java e ColaboracaoServiceTest.java.
- Frontend: src/App.jsx, src/componentes/ShellDashboard.jsx, src/paginas/Login.jsx, Cadastro.jsx e Autenticacao.css.
- Artefatos de build em target e dist foram regenerados. Histórico do primeiro relatório e vídeos originais preservados em .codex-backups/agro-auditoria-2026-10-19.

## Testes e verificação

- Suíte completa final do backend: 52 testes, zero falhas/erros/ignorados, incluindo 20 testes agrícolas e um cenário Spring/JPA/JDBC integrado. A rodada final já inclui a tara e o endurecimento do OFX.
- Teste Spring completo com JPA/JDBC reais em banco H2 isolado, sem simular o financeiro: cadastra propriedade/safra, gera despesa da colheita, armazena grãos, entrega contrato, confirma receita/comissão, usa máquina, desconta diesel e verifica indicadores e auditoria.
- Esse teste verifica rollback: categoria inválida na comissão desfaz também a receita e os vínculos JDBC criados na mesma liquidação. Uma confirmação posterior válida funciona, sem duplicar receitas ou despesas em reenvios.
- Permissões: filtragem de propriedades, bloqueio de escrita, impossibilidade de alterar administrador, usuário de outra empresa e bloqueio de relatórios gerais.
- Cotações e IA: protocolo HTTP local simulado, cache, deduplicação, isolamento e rejeição de destinos de IA externos/cloud. Não medem precisão de modelo ou disponibilidade de fornecedor real.
- Lint e build do frontend aprovados; login/cadastro conferidos no navegador local em desktop e 390 px sem rolagem horizontal. O navegador respeitou a preferência de movimento reduzido e exibiu poster; não foi possível comprovar reprodução visual nessa condição.
- MP4s convertidos/decodificados e posters inspecionados. Nenhum cadastro ou login com credencial humana foi submetido no navegador.

## Pendências de ativação e limites que permanecem

1. Ensaiar upgrade das migrations e homologar a aplicação com cópia MySQL e contas de teste dedicadas; o banco existente não foi alterado.
2. Configurar provedor autorizado de cotações e validar seu formato real; configurar identificação/contato para clima e coordenadas corretas das propriedades.
3. Instalar/configurar OCR e modelo local de IA e avaliar precisão em romaneios reais. Extração é limitada a três páginas escaneadas e 12.000 caracteres; revisão humana continua obrigatória. Hash detecta arquivo idêntico, não todas as digitalizações diferentes de um mesmo documento comercial.
4. Emissão fiscal agrícola/SEFAZ, conexão Open Finance e outros serviços com credenciais/certificados próprios não estão ativos. Documentos fiscais e notas do SaaS Asaas existentes foram preservados; não confundir esses fluxos com emissão de NF-e agrícola.
5. Alertas meteorológicos oficiais/push, valoração automática de estoque e controles agronômicos regulatórios adicionais não foram implementados. Os avisos meteorológicos locais e registros de aplicação entregues não devem ser apresentados como esses serviços especializados.
6. A inspeção visual não representa regressão manual de todas as telas antigas nem homologação em todos os aparelhos. Não houve publicação em produção.
