package br.com.fluxocaixa.agricola;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola/cotacoes")
public class CotacoesIntegracaoController {
    private final AgricolaService acesso;
    private final CotacoesImportacaoService cotacoes;
    public CotacoesIntegracaoController(AgricolaService acesso,CotacoesImportacaoService cotacoes) {this.acesso=acesso;this.cotacoes=cotacoes;}
    @PostMapping("/sincronizar") public Map<String,Object> sincronizar(@PathVariable Long empresaId) {
        acesso.escrita(empresaId);return Map.of("importadas",cotacoes.sincronizar(empresaId));
    }
}
