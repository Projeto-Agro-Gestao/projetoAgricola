package br.com.fluxocaixa.fornecedor;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record CriarFornecedorRequest(

        @NotBlank(message = "Informe o nome do fornecedor")
        @Size(
                max = 150,
                message = "O nome do fornecedor deve ter no maximo 150 caracteres"
        )
        String nome,

        @Size(max = 150)
        String nomeFantasia,

        @Size(max = 180)
        String razaoSocial,

        @Size(max = 40)
        String inscricaoMunicipal,

        @Size(max = 40)
        String inscricaoEstadual,

        @Size(max = 80)
        String regimeTributario,

        TipoPessoaFornecedor tipoPessoa,

        @Size(max = 20)
        String documento,

        @Size(
                max = 30,
                message = "O telefone deve ter no maximo 30 caracteres"
        )
        String telefone,

        @Size(max = 30)
        String telefoneWhatsapp,

        @Email
        @Size(max = 150)
        String email,

        @Size(max = 150)
        String contatoComercial,

        @Size(max = 180)
        String site,

        @Size(
                max = 500,
                message = "A observacao deve ter no maximo 500 caracteres"
        )
        String observacao,

        Boolean ativo,

        @Size(max = 12)
        String cep,

        @Size(max = 180)
        String logradouro,

        @Size(max = 30)
        String numero,

        @Size(max = 100)
        String complemento,

        @Size(max = 100)
        String bairro,

        @Size(max = 100)
        String municipio,

        @Size(max = 2)
        String uf,

        @Size(max = 60)
        String pais,

        @Min(0)
        Integer prazoMedioEntregaDias,

        @Size(max = 250)
        String formasPagamento,

        @Size(max = 100)
        String prazoPagamento,

        @Size(max = 150)
        String condicaoFrete,

        @DecimalMin("0.00")
        @Digits(integer = 17, fraction = 2)
        BigDecimal valorMinimoPedido,

        @Size(max = 500)
        String observacoesComerciais

) {
}
