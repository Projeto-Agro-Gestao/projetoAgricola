package br.com.fluxocaixa.contafinanceira;

import jakarta.validation.constraints.Size;

public record EnviarContaAoFinanceiroRequest(

        Long categoriaId,

        @Size(
                max = 100,
                message = "O nome da categoria deve ter no máximo 100 caracteres"
        )
        String novaCategoriaNome,

        @Size(
                max = 500,
                message = "A observação deve ter no máximo 500 caracteres"
        )
        String observacao

) {
}
