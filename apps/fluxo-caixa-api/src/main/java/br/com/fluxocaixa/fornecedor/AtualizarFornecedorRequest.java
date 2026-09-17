package br.com.fluxocaixa.fornecedor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarFornecedorRequest(

        @NotBlank(message = "Informe o nome do fornecedor")
        @Size(
                max = 150,
                message = "O nome do fornecedor deve ter no maximo 150 caracteres"
        )
        String nome,

        @Size(
                max = 30,
                message = "O telefone deve ter no maximo 30 caracteres"
        )
        String telefone,

        @Size(
                max = 500,
                message = "A observacao deve ter no maximo 500 caracteres"
        )
        String observacao

) {
}
