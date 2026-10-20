package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.movimentacao.CriarMovimentacaoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola")
public class ProducaoIntegradaController {
    private final ProducaoIntegradaService service;
    public ProducaoIntegradaController(ProducaoIntegradaService service) { this.service=service; }
    public record Armazem(@NotNull @Positive Long propriedadeId,@NotBlank @Size(max=120) String nome,
            @NotNull @DecimalMin("0.001") @Digits(integer=16,fraction=3) BigDecimal capacidadeKg) {}
    public record Deposito(@NotNull @Positive Long armazemId,@NotNull @Positive Long operacaoId,
            @NotBlank @Pattern(regexp="[a-zA-Z0-9-]{8,64}") String chave,
            @NotNull @DecimalMin("0.001") @Digits(integer=16,fraction=3) BigDecimal quantidadeKg,@NotNull @PastOrPresent LocalDate data) {}
    public record Entrega(@NotNull @Positive Long contratoId,@NotNull @Positive Long armazemId,
            @NotBlank @Pattern(regexp="[a-zA-Z0-9-]{8,64}") String chave,
            @NotNull @DecimalMin("0.001") @Digits(integer=16,fraction=3) BigDecimal quantidadeKg,@NotNull @PastOrPresent LocalDate data) {}
    public record Liquidacao(@NotNull @PastOrPresent LocalDate data,@Positive Long categoriaReceitaId,@Positive Long categoriaComissaoId) {}
    public record Maquina(@NotNull @Positive Long propriedadeId,@NotBlank @Size(max=120) String nome,
            @NotBlank @Size(max=80) String identificacao,@NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal horimetro,
            @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal proximaManutencao) {}
    public record Uso(@NotNull @Positive Long maquinaId,@NotNull @Positive Long operacaoId,
            @NotBlank @Pattern(regexp="[a-zA-Z0-9-]{8,64}") String chave,@NotBlank @Pattern(regexp="USO|MANUTENCAO") String tipo,
            @NotNull @DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal horas,
            @NotNull @DecimalMin("0") @Digits(integer=16,fraction=3) BigDecimal combustivelLitros,
            @NotBlank @Size(max=300) String observacao,@Valid CriarMovimentacaoRequest financeiro,
            @Positive Long insumoCombustivelId,@DecimalMin("0") @Digits(integer=17,fraction=2) BigDecimal proximaManutencao) {}
    @GetMapping("/armazens") public List<Map<String,Object>> armazens(@PathVariable Long empresaId) { return service.armazens(empresaId); }
    @PostMapping("/armazens") public Map<String,Object> armazem(@PathVariable Long empresaId,@Valid @RequestBody Armazem r) { return service.armazem(empresaId,r); }
    @PostMapping("/depositos") public Map<String,Object> deposito(@PathVariable Long empresaId,@Valid @RequestBody Deposito r) { return service.depositar(empresaId,r); }
    @GetMapping("/graos") public List<Map<String,Object>> graos(@PathVariable Long empresaId) { return service.graos(empresaId); }
    @PostMapping("/entregas") public Map<String,Object> entrega(@PathVariable Long empresaId,@Valid @RequestBody Entrega r) { return service.entregar(empresaId,r); }
    @GetMapping("/entregas") public List<Map<String,Object>> entregas(@PathVariable Long empresaId) { return service.entregas(empresaId); }
    @PostMapping("/entregas/{id}/liquidar") public Map<String,Object> liquidar(@PathVariable Long empresaId,@PathVariable Long id,@Valid @RequestBody Liquidacao r) { return service.liquidar(empresaId,id,r); }
    @GetMapping("/maquinas") public List<Map<String,Object>> maquinas(@PathVariable Long empresaId) { return service.maquinas(empresaId); }
    @PostMapping("/maquinas") public Map<String,Object> maquina(@PathVariable Long empresaId,@Valid @RequestBody Maquina r) { return service.maquina(empresaId,r); }
    @PostMapping("/usos-maquinas") public Map<String,Object> uso(@PathVariable Long empresaId,@Valid @RequestBody Uso r) { return service.usar(empresaId,r); }
    @GetMapping("/usos-maquinas") public List<Map<String,Object>> usos(@PathVariable Long empresaId) { return service.usos(empresaId); }
}
