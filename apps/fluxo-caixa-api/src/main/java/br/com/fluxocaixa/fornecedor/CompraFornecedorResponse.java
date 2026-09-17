package br.com.fluxocaixa.fornecedor;

import java.math.BigDecimal;
import java.time.LocalDate;

public record CompraFornecedorResponse(

        String origem,
        Long origemId,
        LocalDate data,
        String descricao,
        BigDecimal valor,
        String categoriaNome,
        String compradorNome,
        String situacao

) {
}
