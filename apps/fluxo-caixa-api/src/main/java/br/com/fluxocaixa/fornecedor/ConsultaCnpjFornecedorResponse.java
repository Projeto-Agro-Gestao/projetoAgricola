package br.com.fluxocaixa.fornecedor;

public record ConsultaCnpjFornecedorResponse(

        String cnpj,
        String nomeFantasia,
        String razaoSocial,
        String inscricaoMunicipal,
        String inscricaoEstadual,
        String regimeTributario,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String municipio,
        String uf,
        String pais

) {
}
