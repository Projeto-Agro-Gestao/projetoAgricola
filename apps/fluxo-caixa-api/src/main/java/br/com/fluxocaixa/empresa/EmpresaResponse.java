package br.com.fluxocaixa.empresa;

import java.time.LocalDateTime;

public record EmpresaResponse(

        Long id,
        String nome,
        String documento,
        boolean ativo,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static EmpresaResponse de(Empresa empresa) {
        return new EmpresaResponse(
                empresa.getId(),
                empresa.getNome(),
                empresa.getDocumento(),
                empresa.isAtivo(),
                empresa.getCriadoEm(),
                empresa.getAtualizadoEm()
        );
    }
}