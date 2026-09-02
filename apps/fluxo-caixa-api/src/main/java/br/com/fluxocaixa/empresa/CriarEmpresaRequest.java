package br.com.fluxocaixa.empresa;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CriarEmpresaRequest(

        @NotBlank(message = "O nome da empresa é obrigatório")
        @Size(max = 150, message = "O nome deve possuir no máximo 150 caracteres")
        String nome,

        @Size(max = 20, message = "O documento deve possuir no máximo 20 caracteres")
        String documento

) {
}