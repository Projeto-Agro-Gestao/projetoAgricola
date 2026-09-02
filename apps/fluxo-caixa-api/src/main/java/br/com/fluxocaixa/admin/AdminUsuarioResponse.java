package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.StatusPagamento;
import br.com.fluxocaixa.usuario.Usuario;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record AdminUsuarioResponse(

        Long id,
        Long empresaId,
        String nomeEmpresa,
        String nome,
        String email,
        PapelUsuario papel,
        boolean ativo,
        boolean acessoLiberado,
        StatusPagamento statusPagamento,
        LocalDate dataVencimentoPagamento,
        LocalDateTime ultimoLoginEm,
        LocalDateTime ultimoUsoEm,
        long usosHoje,
        long usosTotais,
        long diasComUso,
        BigDecimal mediaUsoPorDia,
        String situacao

) {

    public static AdminUsuarioResponse de(
            Usuario usuario,
            long usosHoje,
            long usosTotais,
            long diasComUso,
            BigDecimal mediaUsoPorDia,
            String situacao) {

        return new AdminUsuarioResponse(
                usuario.getId(),
                usuario.getEmpresa().getId(),
                usuario.getEmpresa().getNome(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getPapel(),
                usuario.isAtivo(),
                usuario.isAcessoLiberado(),
                usuario.getStatusPagamento(),
                usuario.getDataVencimentoPagamento(),
                usuario.getUltimoLoginEm(),
                usuario.getUltimoUsoEm(),
                usosHoje,
                usosTotais,
                diasComUso,
                mediaUsoPorDia,
                situacao
        );
    }
}
