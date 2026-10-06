package br.com.fluxocaixa.configuracao;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
        Cors cors,

        @Valid
        @NotNull
        Refresh refresh

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

    public record Refresh(

            @Min(
                    value = 1,
                    message =
                            "O refresh token deve durar "
                                    + "pelo menos 1 dia"
            )
            @Max(
                    value = 90,
                    message =
                            "O refresh token não pode durar "
                                    + "mais que 90 dias"
            )
            int expiracaoDias,

            @Min(
                    value = 1,
                    message =
                            "O refresh token com lembrar deve durar "
                                    + "pelo menos 1 dia"
            )
            @Max(
                    value = 365,
                    message =
                            "O refresh token com lembrar não pode durar "
                                    + "mais que 365 dias"
            )
            int expiracaoDiasLembrar,

            @NotBlank(
                    message =
                            "O nome do cookie de refresh "
                                    + "é obrigatório"
            )
            String nomeCookie,

            @NotBlank(
                    message =
                            "O path do cookie de refresh "
                                    + "é obrigatório"
            )
            @Pattern(
                    regexp = "/.*",
                    message =
                            "O path do cookie de refresh "
                                    + "deve começar com /"
            )
            String path,

            @NotBlank(
                    message =
                            "O SameSite do cookie de refresh "
                                    + "é obrigatório"
            )
            @Pattern(
                    regexp = "Lax|Strict|None",
                    message =
                            "O SameSite do cookie de refresh "
                                    + "deve ser Lax, Strict ou None"
            )
            String sameSite

    ) {
    }
}