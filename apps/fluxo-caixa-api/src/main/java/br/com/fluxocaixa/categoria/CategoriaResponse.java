package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.movimentacao.TipoMovimentacao;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CategoriaResponse(

        Long id,
        Long empresaId,
        String nome,
        TipoMovimentacao tipo,
        AreaCategoria area,
        String areaDescricao,
        String explicacao,
        boolean ativo,
        LocalDateTime arquivadaEm,
        LocalDate dataLiberacaoExclusao,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static CategoriaResponse de(
            Categoria categoria) {

        LocalDate dataLiberacaoExclusao = null;

        if (categoria.getArquivadaEm() != null) {
            dataLiberacaoExclusao =
                    categoria.getArquivadaEm()
                            .toLocalDate()
                            .plusDays(7);
        }

        return new CategoriaResponse(
                categoria.getId(),
                categoria.getEmpresa().getId(),
                categoria.getNome(),
                categoria.getTipo(),
                categoria.getArea(),
                categoria.getArea().getDescricao(),
                categoria.getTipo().getDescricao(),
                categoria.isAtivo(),
                categoria.getArquivadaEm(),
                dataLiberacaoExclusao,
                categoria.getCriadoEm(),
                categoria.getAtualizadoEm()
        );
    }
}
