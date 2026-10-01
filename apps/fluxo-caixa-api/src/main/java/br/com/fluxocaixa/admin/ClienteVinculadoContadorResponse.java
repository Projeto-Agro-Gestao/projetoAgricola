package br.com.fluxocaixa.admin;

import br.com.fluxocaixa.colaboracao.ContadorEmpresa;
import br.com.fluxocaixa.colaboracao.StatusVinculoContador;

import java.time.LocalDateTime;

public record ClienteVinculadoContadorResponse(
        Long vinculoId,
        Long contadorId,
        String contadorNome,
        Long empresaId,
        String empresaNome,
        StatusVinculoContador status,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm
) {

    public static ClienteVinculadoContadorResponse de(
            ContadorEmpresa vinculo) {

        return new ClienteVinculadoContadorResponse(
                vinculo.getId(),
                vinculo.getContador().getId(),
                vinculo.getContador().getNome(),
                vinculo.getEmpresa().getId(),
                vinculo.getEmpresa().getNome(),
                vinculo.getStatus(),
                vinculo.getCriadoEm(),
                vinculo.getAtualizadoEm()
        );
    }
}
