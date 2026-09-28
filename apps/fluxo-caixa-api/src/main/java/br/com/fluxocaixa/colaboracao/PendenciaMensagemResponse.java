package br.com.fluxocaixa.colaboracao;

import java.time.LocalDateTime;

public record PendenciaMensagemResponse(
        Long id,
        String usuario,
        String mensagem,
        LocalDateTime criadoEm
) {
    public static PendenciaMensagemResponse de(
            PendenciaMensagem mensagem) {
        return new PendenciaMensagemResponse(
                mensagem.getId(),
                mensagem.getUsuario() == null
                        ? null
                        : mensagem.getUsuario().getNome(),
                mensagem.getMensagem(),
                mensagem.getCriadoEm()
        );
    }
}
