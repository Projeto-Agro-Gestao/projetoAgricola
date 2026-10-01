package br.com.fluxocaixa.integracaooficial;

import br.com.fluxocaixa.comum.documento.DocumentoFiscalValidator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class OfficialCnpjService {

    private final OfficialIntegrationProperties properties;
    private final OfficialCnpjCacheRepository cacheRepository;
    private final List<OfficialCnpjProvider> providers;

    public OfficialCnpjService(
            OfficialIntegrationProperties properties,
            OfficialCnpjCacheRepository cacheRepository,
            List<OfficialCnpjProvider> providers) {
        this.properties = properties;
        this.cacheRepository = cacheRepository;
        this.providers = providers;
    }

    @Transactional(readOnly = true)
    public OfficialIntegrationStatusResponse status() {
        return providerAtual().status();
    }

    public OfficialIntegrationStatusResponse testarConexao() {
        return providerAtual().testarConexao();
    }

    @Transactional(readOnly = true)
    public OfficialIntegrationSetupResponse setup() {
        OfficialIntegrationProperties.Cnpj cnpj = properties.getCnpj();
        OfficialIntegrationStatusResponse status = status();

        List<OfficialIntegrationRequirementResponse> requisitos = List.of(
                requisito(
                        "OFFICIAL_CNPJ_PROVIDER",
                        "Selecionar SERPRO para ativar a consulta oficial.",
                        true,
                        cnpj.getProvider() == OfficialCnpjProviderType.SERPRO,
                        false
                ),
                requisito(
                        "SERPRO_BASE_URL",
                        "URL base do produto contratado no SERPRO.",
                        true,
                        !cnpj.getBaseUrl().isBlank(),
                        false
                ),
                requisito(
                        "SERPRO_TOKEN_URL",
                        "Endpoint oficial de token informado na documentacao.",
                        true,
                        !cnpj.getTokenUrl().isBlank(),
                        false
                ),
                requisito(
                        "SERPRO_CONSUMER_KEY",
                        "Consumer key gerada na area do cliente SERPRO.",
                        true,
                        !cnpj.getConsumerKey().isBlank(),
                        true
                ),
                requisito(
                        "SERPRO_CONSUMER_SECRET",
                        "Consumer secret gerada na area do cliente SERPRO.",
                        true,
                        !cnpj.getConsumerSecret().isBlank(),
                        true
                ),
                requisito(
                        "SERPRO_CNPJ_PATH_TEMPLATE",
                        "Caminho do recurso CNPJ, mantendo {cnpj}.",
                        true,
                        !cnpj.getCnpjPathTemplate().isBlank()
                                && cnpj.getCnpjPathTemplate().contains("{cnpj}"),
                        false
                ),
                requisito(
                        "SERPRO_CERTIFICATE_PATH",
                        "Arquivo secreto do certificado, se exigido pelo contrato.",
                        false,
                        !cnpj.getCertificatePath().isBlank(),
                        true
                ),
                requisito(
                        "SERPRO_CERTIFICATE_PASSWORD",
                        "Senha do certificado, se exigida pelo contrato.",
                        false,
                        !cnpj.getCertificatePassword().isBlank(),
                        true
                )
        );

        boolean obrigatoriosConfigurados = requisitos.stream()
                .filter(OfficialIntegrationRequirementResponse::obrigatorio)
                .allMatch(OfficialIntegrationRequirementResponse::configurado);

        List<OfficialIntegrationSetupStepResponse> passos = List.of(
                passo(
                        "Habilitar produto oficial",
                        "Contrate/habilite a Consulta CNPJ no SERPRO usando a conta e-CNPJ autorizada.",
                        cnpj.getProvider() == OfficialCnpjProviderType.SERPRO
                ),
                passo(
                        "Cadastrar variaveis no Render",
                        "Preencha as variaveis do backend. O frontend nao recebe nem armazena credenciais.",
                        obrigatoriosConfigurados
                ),
                passo(
                        "Testar conexao",
                        "Use o botao Testar conexao para validar autenticacao e disponibilidade do provider.",
                        status.status() == OfficialIntegrationStatus.CONECTADO
                ),
                passo(
                        "Usar nos cadastros",
                        "Depois de conectado, cadastros de fornecedor e empresa podem consultar CNPJ pelo backend.",
                        status.status() == OfficialIntegrationStatus.CONECTADO
                )
        );

        return new OfficialIntegrationSetupResponse(
                cnpj.getProvider(),
                status.status(),
                obrigatoriosConfigurados,
                requisitos,
                passos,
                linksOficiais(),
                obrigatoriosConfigurados
                        ? "Configuracao minima pronta para testar conexao."
                        : "Configure as variaveis obrigatorias no backend para ativar a consulta oficial."
        );
    }

    @Transactional
    public CnpjOfficialDataResponse consultar(String cnpj) {
        String normalizado = validarCnpj(cnpj);
        OfficialCnpjProvider provider = providerAtual();

        CnpjOfficialDataResponse emCache =
                obterCacheValido(normalizado, provider.tipo());

        if (emCache != null) {
            return emCache;
        }

        CnpjOfficialDataResponse dados = provider.consultar(normalizado);
        cacheRepository.save(new OfficialCnpjCache(dados));
        return dados;
    }

    public String validarCnpj(String cnpj) {
        String normalizado = DocumentoFiscalValidator.normalizar(cnpj);

        if (!DocumentoFiscalValidator.cnpjValido(normalizado)) {
            throw new IllegalArgumentException("CNPJ invalido.");
        }

        return normalizado;
    }

    private CnpjOfficialDataResponse obterCacheValido(
            String cnpj,
            OfficialCnpjProviderType provider) {
        LocalDateTime limite =
                LocalDateTime.now().minus(properties.getCnpj().getCacheTtl());

        return cacheRepository
                .findFirstByCnpjAndProviderOrderByConsultadoEmDesc(
                        cnpj,
                        provider
                )
                .filter(cache -> cache.getConsultadoEm().isAfter(limite))
                .map(cache -> cache.toResponse(true))
                .orElse(null);
    }

    private OfficialCnpjProvider providerAtual() {
        OfficialCnpjProviderType tipo =
                properties.getCnpj().getProvider();

        return providers.stream()
                .filter(provider -> provider.tipo() == tipo)
                .findFirst()
                .orElseGet(() -> providers.stream()
                        .filter(provider -> provider.tipo()
                                == OfficialCnpjProviderType.DISABLED)
                        .findFirst()
                        .orElseThrow());
    }

    private OfficialIntegrationRequirementResponse requisito(
            String chave,
            String descricao,
            boolean obrigatorio,
            boolean configurado,
            boolean segredo) {
        return new OfficialIntegrationRequirementResponse(
                chave,
                descricao,
                obrigatorio,
                configurado,
                segredo
        );
    }

    private OfficialIntegrationSetupStepResponse passo(
            String titulo,
            String descricao,
            boolean concluido) {
        return new OfficialIntegrationSetupStepResponse(
                titulo,
                descricao,
                concluido
        );
    }

    private List<OfficialIntegrationLinkResponse> linksOficiais() {
        return List.of(
                new OfficialIntegrationLinkResponse(
                        "Servico gov.br de Consulta CNPJ",
                        "https://www.gov.br/pt-br/servicos/obter-solucao-de-consulta-de-dados-do-cadastro-nacional-de-pessoas-juridicas-cnpj"
                ),
                new OfficialIntegrationLinkResponse(
                        "Documentacao Conecta gov.br Consulta CNPJ",
                        "https://www.gov.br/conecta/catalogo/apis/consulta-cnpj/swagger_api_cnpj.md/swagger_view"
                ),
                new OfficialIntegrationLinkResponse(
                        "Area do cliente SERPRO",
                        "https://cliente.serpro.gov.br"
                ),
                new OfficialIntegrationLinkResponse(
                        "Portal do Simples Nacional",
                        "https://www8.receita.fazenda.gov.br/SimplesNacional/"
                )
        );
    }
}
