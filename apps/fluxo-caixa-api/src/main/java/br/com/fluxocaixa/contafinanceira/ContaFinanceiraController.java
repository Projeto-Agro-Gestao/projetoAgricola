package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(
        "/api/v1/empresas/{empresaId}/contas-financeiras"
)
public class ContaFinanceiraController {

    private final ContaFinanceiraService
            contaFinanceiraService;

    public ContaFinanceiraController(
            ContaFinanceiraService
                    contaFinanceiraService) {

        this.contaFinanceiraService =
                contaFinanceiraService;
    }

    @PostMapping
    public ResponseEntity<ContaFinanceiraResponse>
    criar(
            @PathVariable Long empresaId,

            @Valid
            @RequestBody
            CriarContaFinanceiraRequest request) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService.criar(
                        empresaId,
                        request
                );

        URI localizacao =
                ServletUriComponentsBuilder
                        .fromCurrentRequest()
                        .path("/{contaId}")
                        .buildAndExpand(
                                conta.id()
                        )
                        .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(conta);
    }

    @GetMapping
    public ResponseEntity<
            List<ContaFinanceiraResponse>
            >
    listar(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            TipoContaFinanceira tipo,

            @RequestParam(required = false)
            SituacaoContaFinanceira situacao) {

        List<ContaFinanceiraResponse> contas =
                contaFinanceiraService.listar(
                        empresaId,
                        tipo,
                        situacao
                );

        return ResponseEntity.ok(contas);
    }

    @GetMapping("/resumo")
    public ResponseEntity<
            ResumoContasFinanceirasResponse
            >
    resumir(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat.ISO.DATE
            )
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat.ISO.DATE
            )
            LocalDate dataFinal) {

        ResumoContasFinanceirasResponse resumo =
                contaFinanceiraService.resumir(
                        empresaId,
                        dataInicial,
                        dataFinal
                );

        return ResponseEntity.ok(resumo);
    }

    @GetMapping("/projecao")
    public ResponseEntity<
            List<ProjecaoDiariaContaResponse>
            >
    buscarProjecaoDiaria(
            @PathVariable Long empresaId,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat.ISO.DATE
            )
            LocalDate dataInicial,

            @RequestParam(required = false)
            @DateTimeFormat(
                    iso =
                            DateTimeFormat.ISO.DATE
            )
            LocalDate dataFinal) {

        List<ProjecaoDiariaContaResponse>
                projecao =
                contaFinanceiraService
                        .buscarProjecaoDiaria(
                                empresaId,
                                dataInicial,
                                dataFinal
                        );

        return ResponseEntity.ok(
                projecao
        );
    }

    @GetMapping("/lembretes")
    public ResponseEntity<
            List<ContaFinanceiraResponse>
            >
    buscarLembretes(
            @PathVariable Long empresaId) {

        List<ContaFinanceiraResponse> lembretes =
                contaFinanceiraService
                        .buscarLembretes(
                                empresaId
                        );

        return ResponseEntity.ok(
                lembretes
        );
    }

    @GetMapping("/lixeira")
    public ResponseEntity<
            List<ContaFinanceiraResponse>
            >
    listarLixeira(
            @PathVariable Long empresaId) {

        List<ContaFinanceiraResponse> contas =
                contaFinanceiraService
                        .listarLixeira(
                                empresaId
                        );

        return ResponseEntity.ok(contas);
    }

    @GetMapping("/{contaId}")
    public ResponseEntity<ContaFinanceiraResponse>
    buscarPorId(
            @PathVariable Long empresaId,
            @PathVariable Long contaId) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService
                        .buscarPorId(
                                empresaId,
                                contaId
                        );

        return ResponseEntity.ok(conta);
    }

    @PutMapping("/{contaId}")
    public ResponseEntity<ContaFinanceiraResponse>
    atualizar(
            @PathVariable Long empresaId,
            @PathVariable Long contaId,

            @Valid
            @RequestBody
            AtualizarContaFinanceiraRequest request) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService.atualizar(
                        empresaId,
                        contaId,
                        request
                );

        return ResponseEntity.ok(conta);
    }

    @PatchMapping("/{contaId}/lembrete")
    public ResponseEntity<ContaFinanceiraResponse>
    configurarLembrete(
            @PathVariable Long empresaId,
            @PathVariable Long contaId,

            @Valid
            @RequestBody
            ConfigurarLembreteContaRequest request) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService
                        .configurarLembrete(
                                empresaId,
                                contaId,
                                request
                        );

        return ResponseEntity.ok(conta);
    }

    @PatchMapping("/{contaId}/cancelar")
    public ResponseEntity<ContaFinanceiraResponse>
    cancelar(
            @PathVariable Long empresaId,
            @PathVariable Long contaId) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService.cancelar(
                        empresaId,
                        contaId
                );

        return ResponseEntity.ok(conta);
    }

    @PatchMapping("/{contaId}/restaurar")
    public ResponseEntity<ContaFinanceiraResponse>
    restaurar(
            @PathVariable Long empresaId,
            @PathVariable Long contaId) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService.restaurar(
                        empresaId,
                        contaId
                );

        return ResponseEntity.ok(conta);
    }

    @DeleteMapping("/{contaId}/permanente")
    public ResponseEntity<Void>
    excluirPermanentemente(
            @PathVariable Long empresaId,
            @PathVariable Long contaId) {

        contaFinanceiraService.excluirPermanentemente(
                empresaId,
                contaId
        );

        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{contaId}/enviar-financeiro")
    public ResponseEntity<ContaFinanceiraResponse>
    enviarAoFinanceiro(
            @PathVariable Long empresaId,
            @PathVariable Long contaId,

            @Valid
            @RequestBody
            EnviarContaAoFinanceiroRequest request) {

        ContaFinanceiraResponse conta =
                contaFinanceiraService
                        .enviarAoFinanceiro(
                                empresaId,
                                contaId,
                                request
                        );

        return ResponseEntity.ok(conta);
    }

    @PostMapping("/{contaId}/liquidacoes")
    public ResponseEntity<LiquidacaoContaResponse>
    liquidar(
            @PathVariable Long empresaId,
            @PathVariable Long contaId,

            @Valid
            @RequestBody
            LiquidarContaFinanceiraRequest request) {

        LiquidacaoContaResponse liquidacao =
                contaFinanceiraService.liquidar(
                        empresaId,
                        contaId,
                        request
                );

        URI localizacao =
                ServletUriComponentsBuilder
                        .fromCurrentRequest()
                        .path("/{liquidacaoId}")
                        .buildAndExpand(
                                liquidacao.id()
                        )
                        .toUri();

        return ResponseEntity
                .created(localizacao)
                .body(liquidacao);
    }

    @GetMapping("/{contaId}/liquidacoes")
    public ResponseEntity<
            List<LiquidacaoContaResponse>
            >
    listarLiquidacoes(
            @PathVariable Long empresaId,
            @PathVariable Long contaId) {

        List<LiquidacaoContaResponse>
                liquidacoes =
                contaFinanceiraService
                        .listarLiquidacoes(
                                empresaId,
                                contaId
                        );

        return ResponseEntity.ok(
                liquidacoes
        );
    }
}
