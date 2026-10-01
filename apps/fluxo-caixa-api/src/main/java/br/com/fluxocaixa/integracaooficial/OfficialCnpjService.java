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
}
