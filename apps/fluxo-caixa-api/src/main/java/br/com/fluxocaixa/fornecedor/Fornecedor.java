package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.empresa.Empresa;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "fornecedores")
public class Fornecedor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(name = "codigo_cadastro", nullable = false)
    private Long codigoCadastro;

    @Column(name = "nome_fantasia", length = 150)
    private String nomeFantasia;

    @Column(name = "razao_social", length = 180)
    private String razaoSocial;

    @Column(name = "inscricao_municipal", length = 40)
    private String inscricaoMunicipal;

    @Column(name = "inscricao_estadual", length = 40)
    private String inscricaoEstadual;

    @Column(name = "regime_tributario", length = 80)
    private String regimeTributario;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_pessoa", length = 20)
    private TipoPessoaFornecedor tipoPessoa;

    @Column(length = 20)
    private String documento;

    @Column(length = 30)
    private String telefone;

    @Column(name = "telefone_whatsapp", length = 30)
    private String telefoneWhatsapp;

    @Column(length = 150)
    private String email;

    @Column(name = "contato_comercial", length = 150)
    private String contatoComercial;

    @Column(length = 180)
    private String site;

    @Column(length = 500)
    private String observacao;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(length = 12)
    private String cep;

    @Column(length = 180)
    private String logradouro;

    @Column(length = 30)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String municipio;

    @Column(length = 2)
    private String uf;

    @Column(length = 60)
    private String pais;

    @Column(name = "prazo_medio_entrega_dias")
    private Integer prazoMedioEntregaDias;

    @Column(name = "formas_pagamento", length = 250)
    private String formasPagamento;

    @Column(name = "prazo_pagamento", length = 100)
    private String prazoPagamento;

    @Column(name = "condicao_frete", length = 150)
    private String condicaoFrete;

    @Column(name = "valor_minimo_pedido", precision = 19, scale = 2)
    private BigDecimal valorMinimoPedido;

    @Column(name = "observacoes_comerciais", length = 500)
    private String observacoesComerciais;

    @Column(nullable = false)
    private boolean excluido = false;

    @Column(name = "excluido_em")
    private LocalDateTime excluidoEm;

    @Version
    @Column(nullable = false)
    private Long versao = 0L;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Fornecedor() {
    }

    public Fornecedor(
            Empresa empresa,
            Long codigoCadastro,
            String nome,
            String telefone,
            String observacao) {

        this.empresa = empresa;
        this.codigoCadastro = codigoCadastro;
        this.nome = nome;
        this.nomeFantasia = nome;
        this.telefone = telefone;
        this.observacao = observacao;
        this.pais = "Brasil";
    }

    public void atualizar(
            String nome,
            String telefone,
            String observacao) {

        this.nome = nome;
        this.nomeFantasia = nome;
        this.telefone = telefone;
        this.observacao = observacao;
    }

    public void atualizarCadastroProfissional(
            String nome,
            String nomeFantasia,
            String razaoSocial,
            String inscricaoMunicipal,
            String inscricaoEstadual,
            String regimeTributario,
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
            String observacoesComerciais) {

        this.nome = nome;
        this.nomeFantasia = nomeFantasia;
        this.razaoSocial = razaoSocial;
        this.inscricaoMunicipal = inscricaoMunicipal;
        this.inscricaoEstadual = inscricaoEstadual;
        this.regimeTributario = regimeTributario;
        this.tipoPessoa = tipoPessoa;
        this.documento = documento;
        this.telefone = telefone;
        this.telefoneWhatsapp = telefoneWhatsapp;
        this.email = email;
        this.contatoComercial = contatoComercial;
        this.site = site;
        this.observacao = observacao;
        this.ativo = ativo;
        this.cep = cep;
        this.logradouro = logradouro;
        this.numero = numero;
        this.complemento = complemento;
        this.bairro = bairro;
        this.municipio = municipio;
        this.uf = uf;
        this.pais = pais;
        this.prazoMedioEntregaDias = prazoMedioEntregaDias;
        this.formasPagamento = formasPagamento;
        this.prazoPagamento = prazoPagamento;
        this.condicaoFrete = condicaoFrete;
        this.valorMinimoPedido = valorMinimoPedido;
        this.observacoesComerciais = observacoesComerciais;
    }

    public void moverParaLixeira() {
        this.excluido = true;
        this.excluidoEm = LocalDateTime.now();
    }

    public void restaurar() {
        this.excluido = false;
        this.excluidoEm = null;
    }

    public Long getId() {
        return id;
    }

    public Empresa getEmpresa() {
        return empresa;
    }

    public String getNome() {
        return nome;
    }

    public Long getCodigoCadastro() {
        return codigoCadastro;
    }

    public String getNomeFantasia() {
        return nomeFantasia;
    }

    public String getRazaoSocial() {
        return razaoSocial;
    }

    public String getInscricaoMunicipal() {
        return inscricaoMunicipal;
    }

    public String getInscricaoEstadual() {
        return inscricaoEstadual;
    }

    public String getRegimeTributario() {
        return regimeTributario;
    }

    public TipoPessoaFornecedor getTipoPessoa() {
        return tipoPessoa;
    }

    public String getDocumento() {
        return documento;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getTelefoneWhatsapp() {
        return telefoneWhatsapp;
    }

    public String getEmail() {
        return email;
    }

    public String getContatoComercial() {
        return contatoComercial;
    }

    public String getSite() {
        return site;
    }

    public String getObservacao() {
        return observacao;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public String getCep() {
        return cep;
    }

    public String getLogradouro() {
        return logradouro;
    }

    public String getNumero() {
        return numero;
    }

    public String getComplemento() {
        return complemento;
    }

    public String getBairro() {
        return bairro;
    }

    public String getMunicipio() {
        return municipio;
    }

    public String getUf() {
        return uf;
    }

    public String getPais() {
        return pais;
    }

    public Integer getPrazoMedioEntregaDias() {
        return prazoMedioEntregaDias;
    }

    public String getFormasPagamento() {
        return formasPagamento;
    }

    public String getPrazoPagamento() {
        return prazoPagamento;
    }

    public String getCondicaoFrete() {
        return condicaoFrete;
    }

    public BigDecimal getValorMinimoPedido() {
        return valorMinimoPedido;
    }

    public String getObservacoesComerciais() {
        return observacoesComerciais;
    }

    public boolean isExcluido() {
        return excluido;
    }

    public LocalDateTime getExcluidoEm() {
        return excluidoEm;
    }

    public Long getVersao() {
        return versao;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }
}
