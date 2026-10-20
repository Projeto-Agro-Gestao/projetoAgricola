package br.com.fluxocaixa.agricola;

import br.com.fluxocaixa.movimentacao.CriarMovimentacaoRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola")
public class AgricolaController {
    private final AgricolaService service;
    public AgricolaController(AgricolaService service) { this.service = service; }

    public record Safra(@NotNull @Positive Long propriedadeId, @NotBlank @Size(max=120) String nome,
            @NotBlank @Size(max=80) String cultura, @NotBlank @Size(max=120) String talhao,
            @NotNull @DecimalMin("0.0001") @Digits(integer=15,fraction=4) BigDecimal areaHectares,
            @NotNull LocalDate inicio, @NotNull LocalDate fim) {}
    public record Operacao(@NotNull @Positive Long safraId, Long romaneioId,
            @NotBlank @Pattern(regexp="[a-zA-Z0-9-]{8,64}") String chave,
            @NotBlank @Pattern(regexp="PLANTIO|COLHEITA|INSUMO|MAQUINA|COMBUSTIVEL|ARMAZENAGEM|OUTRO") String tipo,
            @NotBlank @Size(max=150) String descricao, @NotNull @PastOrPresent LocalDate data,
            @NotNull @DecimalMin("0") @Digits(integer=16,fraction=3) BigDecimal quantidadeKg,
            @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=4) BigDecimal umidade,
            @NotNull @DecimalMin("0") @DecimalMax("100") @Digits(integer=3,fraction=4) BigDecimal impurezas,
            @NotNull @DecimalMin("0") @Digits(integer=16,fraction=3) BigDecimal descontoKg,
            @Valid CriarMovimentacaoRequest financeiro,
            @DecimalMin("0") @Digits(integer=16,fraction=3) BigDecimal taraKg) {
        public Operacao(Long safraId,Long romaneioId,String chave,String tipo,String descricao,LocalDate data,BigDecimal quantidadeKg,BigDecimal umidade,BigDecimal impurezas,BigDecimal descontoKg,CriarMovimentacaoRequest financeiro) {
            this(safraId,romaneioId,chave,tipo,descricao,data,quantidadeKg,umidade,impurezas,descontoKg,financeiro,BigDecimal.ZERO);
        }
    }

    @GetMapping("/safras") public List<Map<String,Object>> safras(@PathVariable Long empresaId) { return service.safras(empresaId); }
    @PostMapping("/safras") public Map<String,Object> criarSafra(@PathVariable Long empresaId, @Valid @RequestBody Safra r) { return service.criarSafra(empresaId,r); }
    @GetMapping("/operacoes") public List<Map<String,Object>> operacoes(@PathVariable Long empresaId) { return service.operacoes(empresaId); }
    @PostMapping("/operacoes") public Map<String,Object> criarOperacao(@PathVariable Long empresaId, @Valid @RequestBody Operacao r) { return service.criarOperacao(empresaId,r); }
    @GetMapping("/romaneios") public List<Map<String,Object>> romaneios(@PathVariable Long empresaId) { return service.romaneios(empresaId); }
    @GetMapping("/romaneios/{id}/arquivo") public org.springframework.http.ResponseEntity<byte[]> arquivo(@PathVariable Long empresaId,@PathVariable Long id) {
        var documento=service.arquivoRomaneio(empresaId,id);
        return org.springframework.http.ResponseEntity.ok().contentType(org.springframework.http.MediaType.APPLICATION_OCTET_STREAM)
            .header("Content-Disposition",org.springframework.http.ContentDisposition.attachment().filename(documento.getNomeArquivo(),java.nio.charset.StandardCharsets.UTF_8).build().toString())
            .body(documento.getConteudo());
    }
    @PostMapping(value="/romaneios", consumes="multipart/form-data") public Map<String,Object> importar(@PathVariable Long empresaId, @RequestPart("arquivo") MultipartFile arquivo,@RequestParam(required=false) Long propriedadeId) { return service.importar(empresaId,arquivo,propriedadeId); }
}
