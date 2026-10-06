package br.com.fluxocaixa.autenticacao;

import br.com.fluxocaixa.usuario.EntrarResponse;

public record SessaoEmitida(

        EntrarResponse corpo,
        String refreshTokenCru,
        long refreshTtlDias

) {
}
