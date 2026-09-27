package br.com.fluxocaixa.usuario;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AtualizarPerfilRequest(

        @NotBlank(
                message = "Digite o nome da propriedade"
        )
        @Size(
                max = 150,
                message = "O nome da propriedade deve possuir "
                        + "no maximo 150 caracteres"
        )
        String nomeEmpresa,

        @NotBlank(
                message = "Digite o nome do produtor"
        )
        @Size(
                max = 120,
                message = "O nome do produtor deve possuir "
                        + "no maximo 120 caracteres"
        )
        String nome,

        @Size(
                max = 20,
                message = "O telefone deve possuir "
                        + "no maximo 20 caracteres"
        )
        String telefone,

        @Size(max = 20, message = "O documento deve possuir no maximo 20 caracteres")
        String documentoPagamento,

        @Size(max = 12, message = "O CEP deve possuir no maximo 12 caracteres")
        String cepCobranca,

        @Size(max = 150, message = "A rua deve possuir no maximo 150 caracteres")
        String ruaCobranca,

        @Size(max = 20, message = "O numero deve possuir no maximo 20 caracteres")
        String numeroCobranca,

        @Size(max = 100, message = "O bairro deve possuir no maximo 100 caracteres")
        String bairroCobranca,

        @Size(max = 100, message = "A cidade deve possuir no maximo 100 caracteres")
        String cidadeCobranca,

        @Size(max = 2, message = "O estado deve possuir a sigla com 2 letras")
        String estadoCobranca,

        boolean agriculturaAtiva,
        boolean pecuariaAtiva

) {

    @AssertTrue(
            message = "Escolha Agricultura, Pecuaria ou as duas atividades"
    )
    public boolean isAtividadeSelecionada() {

        return agriculturaAtiva || pecuariaAtiva;
    }
}
