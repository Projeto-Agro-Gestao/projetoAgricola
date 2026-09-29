package br.com.fluxocaixa.fornecedor;

import java.time.LocalDateTime;
import java.math.BigDecimal;

public record FornecedorResponse(

        Long id,
        Long empresaId,
        String nome,
        String nomeFantasia,
        String razaoSocial,
        TipoPessoaFornecedor tipoPessoa,
        String documento,
        String telefone,
        String telefoneWhatsapp,
        String email,
        String contatoComercial,
        String site,
        String observacao,
        boolean ativo,
        String cep,
        String logradouro,
        String numero,
        String complemento,
        String bairro,
        String municipio,
        String uf,
        String pais,
        Integer prazoMedioEntregaDias,
        String formasPagamento,
        String prazoPagamento,
        String condicaoFrete,
        BigDecimal valorMinimoPedido,
        String observacoesComerciais,
        boolean excluido,
        LocalDateTime excluidoEm,
        LocalDateTime criadoEm,
        LocalDateTime atualizadoEm

) {

    public static FornecedorResponse de(
            Fornecedor fornecedor) {

        return new FornecedorResponse(
                fornecedor.getId(),
                fornecedor.getEmpresa().getId(),
                fornecedor.getNome(),
                fornecedor.getNomeFantasia(),
                fornecedor.getRazaoSocial(),
                fornecedor.getTipoPessoa(),
                fornecedor.getDocumento(),
                fornecedor.getTelefone(),
                fornecedor.getTelefoneWhatsapp(),
                fornecedor.getEmail(),
                fornecedor.getContatoComercial(),
                fornecedor.getSite(),
                fornecedor.getObservacao(),
                fornecedor.isAtivo(),
                fornecedor.getCep(),
                fornecedor.getLogradouro(),
                fornecedor.getNumero(),
                fornecedor.getComplemento(),
                fornecedor.getBairro(),
                fornecedor.getMunicipio(),
                fornecedor.getUf(),
                fornecedor.getPais(),
                fornecedor.getPrazoMedioEntregaDias(),
                fornecedor.getFormasPagamento(),
                fornecedor.getPrazoPagamento(),
                fornecedor.getCondicaoFrete(),
                fornecedor.getValorMinimoPedido(),
                fornecedor.getObservacoesComerciais(),
                fornecedor.isExcluido(),
                fornecedor.getExcluidoEm(),
                fornecedor.getCriadoEm(),
                fornecedor.getAtualizadoEm()
        );
    }
}
