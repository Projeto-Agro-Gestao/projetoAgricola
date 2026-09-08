package br.com.fluxocaixa.usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UsuarioResponse(

        Long id,
        Long empresaId,
        String nomeEmpresa,
        String nome,
        String email,
        String telefone,
        PapelUsuario papel,
        boolean ativo,
        boolean emailVerificado,
        boolean acessoLiberado,
        TipoAcessoUsuario tipoAcesso,
        LocalDate acessoExpiraEm,
        StatusPagamento statusPagamento,
        LocalDate dataVencimentoPagamento,
        boolean agriculturaAtiva,
        boolean pecuariaAtiva,
        LocalDateTime ultimoLoginEm,
        LocalDateTime ultimoUsoEm,
        LocalDateTime criadoEm

) {

    public static UsuarioResponse de(Usuario usuario) {

        return new UsuarioResponse(
                usuario.getId(),
                usuario.getEmpresa().getId(),
                usuario.getEmpresa().getNome(),
                usuario.getNome(),
                usuario.getEmail(),
                usuario.getTelefone(),
                usuario.getPapel(),
                usuario.isAtivo(),
                usuario.isEmailVerificado(),
                usuario.isAcessoLiberado(),
                usuario.getTipoAcesso(),
                usuario.getAcessoExpiraEm(),
                usuario.getStatusPagamento(),
                usuario.getDataVencimentoPagamento(),
                usuario.getEmpresa()
                        .isAgriculturaAtiva(),
                usuario.getEmpresa()
                        .isPecuariaAtiva(),
                usuario.getUltimoLoginEm(),
                usuario.getUltimoUsoEm(),
                usuario.getCriadoEm()
        );
    }
}
