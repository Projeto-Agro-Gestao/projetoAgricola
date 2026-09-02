package br.com.fluxocaixa.comum.erro;

import java.time.LocalDateTime;
import java.util.Map;

public record ErroResposta(

        LocalDateTime dataHora,
        int status,
        String erro,
        String mensagem,
        String caminho,
        Map<String, String> campos

) {
}