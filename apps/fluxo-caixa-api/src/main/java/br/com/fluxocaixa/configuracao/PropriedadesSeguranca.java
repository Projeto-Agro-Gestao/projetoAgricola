package br.com.fluxocaixa.configuracao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

@ConfigurationProperties(
        prefix = "app.seguranca"
)
@Validated
public record PropriedadesSeguranca(

        @Valid
        @NotNull
        Jwt jwt,

        @Valid
        @NotNull
        Cors cors

) {

    public record Jwt(

            @NotBlank(
                    message =
                            "O emissor do token é obrigatório"
            )
            String emissor,

            @NotBlank(
                    message =
                            "O destinatário do token é obrigatório"
            )
            String destinatario,

            @Min(
                    value = 300,
                    message =
                            "O token deve durar pelo menos "
                                    + "300 segundos"
            )
            @Max(
                    value = 1800,
                    message =
                            "O token não pode durar mais "
                                    + "que 1800 segundos"
            )
            long expiracaoSegundos,

            @NotBlank(
                    message =
                            "A chave secreta do token "
                                    + "é obrigatória"
            )
            String segredoBase64

    ) {
    }

    public record Cors(

            @NotBlank(
                    message =
                            "A origem permitida do WEB "
                                    + "é obrigatória"
            )
            String origemWeb

    ) {
    }
}