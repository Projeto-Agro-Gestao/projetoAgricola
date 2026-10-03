# Seguranca da informacao e protecao de dados

Revisao: 03/10/2026. Este documento registra controles tecnicos e pendencias operacionais. Nao representa parecer juridico, certificacao de conformidade, auditoria exaustiva ou garantia contra qualquer invasao. A aplicabilidade concreta depende dos tratamentos, contratos, publico e infraestrutura do AgroGestao.

## Referencias oficiais e responsabilidades

| Referencia | Impacto a avaliar |
| --- | --- |
| [LGPD, Lei 13.709/2018](https://planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm) | Bases legais, finalidade, minimizacao, direitos dos titulares, registro das operacoes, seguranca e responsabilidade. Arts. 46 e 47 exigem medidas tecnicas e administrativas e confidencialidade. Dados financeiros podem ser dados pessoais; nao sao automaticamente dados pessoais sensiveis na definicao legal. |
| [Marco Civil, Lei 12.965/2014](https://planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l12965.htm) | Avaliar obrigacoes de registros de acesso a aplicacoes, inclusive guarda por seis meses nas condicoes do art. 15, sob sigilo e controle. Nao equivale a guardar indefinidamente todo conteudo financeiro. |
| [Decreto 8.771/2016, texto atualizado](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2016/decreto/d8771.htm) | Controle de acesso, responsabilidades, autenticacao, inventario de acesso a registros e protecao das informacoes. Avaliar tambem alteracoes de 2026 e requisitos de identificacao aplicaveis, inclusive coleta na camada de infraestrutura quando necessaria. |
| [ANPD: comunicacao de incidentes e Resolucao 15/2024](https://www.gov.br/anpd/pt-br/canais_atendimento/agente-de-tratamento/comunicado-de-incidente-de-seguranca-cis) | Incidentes com risco ou dano relevante exigem avaliacao e comunicacao. Prazo geral indicado: tres dias uteis; confirmar hipoteses, excecoes e eventual enquadramento diferenciado antes de aplicar. |
| [ANPD, Resolucao 19/2024](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-19-de-23-de-agosto-de-2024) | Verificar regioes de processamento e mecanismos de transferencia internacional nos contratos com provedores. Nao presumir que toda hospedagem ou fornecedor opera exclusivamente no Brasil. |
| [ANPD, Resolucao 2/2022](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd/resolucao-cd-anpd-no-2-de-27-de-janeiro-de-2022) | Eventual regime de pequeno porte nao elimina obrigacoes de seguranca ou direitos dos titulares. Enquadramento exige verificacao. |
| [ANPD: regulamentos, incluindo encarregado](https://www.gov.br/anpd/pt-br/acesso-a-informacao/institucional/atos-normativos/regulamentacoes_anpd) | Definir responsabilidades e canal de privacidade conforme enquadramento; verificar Resolucao 18/2024. |
| [EC 115/2022](https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc115.htm) e [Lei 14.155/2021](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2021/lei/l14155.htm) | Direito fundamental a protecao de dados e repressao a crimes informaticos. Nao substituem controles de seguranca nem conferem imunidade a ataques. |

Revisar com assessoria competente: papeis de controlador/operador, contratos, aviso de privacidade, atendimento a titulares, retencao, fornecedores e obrigacoes setoriais. Codigo nao resolve essas responsabilidades sozinho.

## Controles implementados

- Isolamento de dados por empresa, autorizacao pelo usuario e papel atuais no banco e verificacao de vinculos do contador. Testes HTTP cobrem leitura e alteracao de recursos de terceiros.
- Login com bloqueio de senha por 15 minutos apos cinco falhas, contador persistido com bloqueio transacional e mensagens genericas de credenciais.
- Limite local de 30 chamadas de autenticacao por minuto por endereco remoto, com HTTP 429, janela e memoria limitada. Nao e protecao distribuida contra DDoS.
- Versao de autenticacao no banco/JWT: trocar ou redefinir senha revoga tokens anteriores. Migration incremental V33. Tokens anteriores sem claim usam versao zero; apos troca de senha deixam de valer.
- CORS com origens exatas, sem curingas de dominios de outros clientes Vercel. Bearer token, sem credenciais de cookies no CORS.
- Cabecalhos de seguranca na API e configuracao Vercel: CSP, bloqueio de enquadramento, nosniff, politica de referenciador e restricao de permissoes.
- Upload limitado a 10 MB: PDF, XML, PNG e JPEG. Nome higienizado, assinatura/formato conferidos; XML proibe DTD e entidades externas. Arquivos continuam sujeitos a autorizacao e download protegido.
- Mensagens de erro de transporte Asaas sanitizadas, sem copiar respostas externas para logs de diagnostico.
- Modelo Docker com usuario nao privilegiado. Isso nao muda automaticamente a hospedagem nativa do Render.

PDF com assinatura valida nao significa arquivo livre de malware. A validacao nao substitui antivirus, sandbox, quarentena nem analise de conteudo ativo. Token no localStorage ainda tem risco residual em caso de XSS; CSP reduz superficie, mas nao elimina esse risco.

## Publicacao e verificacao de producao

1. Aplicar V33 pelo Flyway sem editar migrations antigas; validar em staging com MySQL e backup recuperavel.
2. Configurar APP_WEB_ORIGINS com URLs exatas confiaveis. Nao usar `*` nem `https://*.vercel.app`.
3. CSP da Vercel permite a API `https://projetoagricola.onrender.com` e Google Identity Services. Se VITE_API_URL mudar, revisar connect-src explicitamente; nao liberar todos os dominios para resolver falhas.
4. Publicar frontend e backend e conferir cabecalhos HTTP, health e isolamento com contas de teste. Os testes locais usam H2 isolado, nao acessam dados reais de clientes.
5. Configurar proxy confiavel que remova cabecalhos de encaminhamento enviados pelo cliente. O limitador nao interpreta X-Forwarded-For diretamente; encaminhamento do servidor depende da infraestrutura. Configurar WAF/rate limit compartilhado para multiplas instancias e protecao contra DDoS.
6. Verificar TLS, certificado do banco, acesso de rede restrito e usuario de banco com privilegios minimos. Configuracao de TLS existente nao prova validacao de identidade do servidor.
7. Estabelecer backups criptografados, teste de restauracao, retencao justificada, trilha de acesso a registros e alertas de autenticacao/anomalias. Nao registrar senha, token, chave ou documentos integrais em logs.
8. Implementar/verificar MFA administrativo, gestao de segredos, rotacao de credenciais e revogacao de acessos de colaboradores. Esses controles operacionais nao foram certificados nesta revisao.
9. Manter atualizacao e verificacao de dependencias de backend/frontend, testes de penetracao periodicos e revisao de autorizacao a cada novo endpoint. Ausencia de alerta no npm audit nao garante ausencia de vulnerabilidade.

## Resposta a incidentes

Conter acesso suspeito, revogar credenciais comprometidas, preservar evidencias sob controle e identificar empresas, titulares, dados e periodo envolvidos. Acionar responsavel pela privacidade/seguranca e avaliar risco e obrigacoes de comunicacao com apoio juridico. Seguir a orientacao vigente da ANPD, sem aguardar conclusao de toda a investigacao se houver obrigacao de comunicar. Recuperar a partir de backup validado, testar isolamento, corrigir a causa e registrar as medidas. Nao apagar evidencias ou divulgar dados de terceiros para diagnostico.

## Verificacao tecnica

Executar Maven test e package no backend; npm run build, npm run test:security e npm run test:remember no frontend. O teste de navegador verifica carregamento do login e bloqueio de script inline com CSP. Os testes de integracao inicializam servidor real com banco H2 descartavel e JWT assinado. Container Docker, deploy Render/Vercel, restore de backup e migration MySQL exigem verificacao especifica no ambiente de publicacao.

Referencias tecnicas: [OWASP Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html), [OWASP File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html) e [OWASP Input Validation](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html).
