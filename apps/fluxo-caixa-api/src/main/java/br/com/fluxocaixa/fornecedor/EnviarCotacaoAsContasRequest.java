package br.com.fluxocaixa.fornecedor;

import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record EnviarCotacaoAsContasRequest(
        Long categoriaId,

        @Size(max = 100)
        String novaCategoriaNome,

        LocalDate dataVencimento,

        @Size(max = 80)
        String numeroDocumento,

        @Size(max = 500)
        String observacao
) {
}
