package br.com.fluxocaixa.usuario;

public record EntrarResponse(

        String token,
        String tipo,
        long expiraEmSegundos,
        UsuarioResponse usuario

) {
}