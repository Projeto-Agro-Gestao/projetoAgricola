package br.com.fluxocaixa.integracaooficial;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public record CnpjOfficialDataResponse(
        String cnpj,
        String razaoSocial,
        String nomeFantasia,
        String situacaoCadastral,
        LocalDate dataSituacao,
        String naturezaJuridica,
        String porte,
        String cnaePrincipal,
        List<String> cnaesSecundarios,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String cep,
        String municipio,
        String uf,
        OfficialCnpjProviderType provider,
        String fonte,
        LocalDateTime dataConsulta,
        boolean cache
) {
}
