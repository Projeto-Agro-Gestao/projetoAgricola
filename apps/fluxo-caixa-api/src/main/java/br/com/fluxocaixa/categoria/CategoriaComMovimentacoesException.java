package br.com.fluxocaixa.categoria;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class CategoriaComMovimentacoesException
        extends RuntimeException {

    private static final DateTimeFormatter
            FORMATADOR_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final LocalDateTime dataReavaliacao;

    public CategoriaComMovimentacoesException(
            String nomeCategoria,
            LocalDateTime dataReavaliacao) {

        super(
                "A categoria \""
                        + nomeCategoria
                        + "\" possui movimentações financeiras "
                        + "e não pode ser excluída agora. "
                        + "Ela foi arquivada para preservar "
                        + "o histórico. Aguarde até "
                        + dataReavaliacao.format(
                        FORMATADOR_DATA
                )
                        + " para revisar a exclusão."
        );

        this.dataReavaliacao = dataReavaliacao;
    }

    public LocalDateTime getDataReavaliacao() {
        return dataReavaliacao;
    }
}
