package br.com.fluxocaixa.agricola;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola/cotacoes")
public class CotacoesController {
    private final AgricolaService acesso;
    private final JdbcTemplate db;
    public CotacoesController(AgricolaService acesso,JdbcTemplate db) { this.acesso=acesso;this.db=db; }
    public record Cotacao(@NotBlank @Size(max=80) String cultura,@NotBlank @Size(max=100) String praca,
            @NotBlank @Size(max=30) String unidade,@NotNull @DecimalMin("0.0001") @Digits(integer=15,fraction=4) BigDecimal valor,
            @NotNull @PastOrPresent LocalDate data,@NotBlank @Size(max=300) String fonte) {}
    @GetMapping public List<Map<String,Object>> listar(@PathVariable Long empresaId) {
        acesso.acesso(empresaId);
        return db.queryForList("SELECT * FROM cotacoes_agricolas WHERE empresa_id=? ORDER BY data_cotacao DESC,id DESC LIMIT 500",empresaId);
    }
    @PostMapping public Map<String,Object> registrar(@PathVariable Long empresaId,@Valid @RequestBody Cotacao r) {
        acesso.escrita(empresaId);
        db.update("INSERT INTO cotacoes_agricolas(empresa_id,cultura,praca,unidade,valor,data_cotacao,fonte) VALUES(?,?,?,?,?,?,?)",empresaId,r.cultura().trim(),r.praca().trim(),r.unidade().trim(),r.valor(),r.data(),r.fonte().trim());
        return Map.of("salvo",true);
    }
}
