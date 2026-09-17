package br.com.fluxocaixa.fornecedor;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EnviarCotacaoAoFinanceiroRequest(
        Long categoriaId,

        @Size(max = 100)
        String novaCategoriaNome,

        LocalDate dataMovimentacao,

        @Size(max = 500)
        String observacao
) {
}
