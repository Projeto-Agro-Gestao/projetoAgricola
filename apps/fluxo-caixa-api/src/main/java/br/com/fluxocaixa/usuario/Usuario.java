package br.com.fluxocaixa.usuario;

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
import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "empresa_id", nullable = false)
    private Empresa empresa;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 150)
    private String email;

    @Column(length = 20)
    private String telefone;

    @Column(name = "senha_hash", nullable = false, length = 255)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private PapelUsuario papel;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(name = "email_verificado", nullable = false)
    private boolean emailVerificado = false;

    @Column(name = "tentativas_login", nullable = false)
    private int tentativasLogin = 0;

    @Column(name = "bloqueado_ate")
    private LocalDateTime bloqueadoAte;

    @Column(name = "ultimo_login_em")
    private LocalDateTime ultimoLoginEm;

    @Column(name = "acesso_liberado", nullable = false)
    private boolean acessoLiberado = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo_acesso", nullable = false, length = 30)
    private TipoAcessoUsuario tipoAcesso =
            TipoAcessoUsuario.NORMAL;

    @Column(name = "acesso_expira_em")
    private LocalDate acessoExpiraEm;

    @Enumerated(EnumType.STRING)
    @Column(name = "status_pagamento", nullable = false, length = 30)
    private StatusPagamento statusPagamento =
            StatusPagamento.EM_DIA;

    @Column(name = "data_vencimento_pagamento")
    private LocalDate dataVencimentoPagamento;

    @Column(name = "ultimo_uso_em")
    private LocalDateTime ultimoUsoEm;

    @Version
    @Column(nullable = false)
    private Long versao;

    @CreationTimestamp
    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(name = "atualizado_em", nullable = false)
    private LocalDateTime atualizadoEm;

    protected Usuario() {
    }

    public Usuario(
            Empresa empresa,
            String nome,
            String email,
            String telefone,
            String senhaHash,
            PapelUsuario papel) {

        this.empresa = empresa;
        this.nome = nome;
        this.email = email;
        this.telefone = telefone;
        this.senhaHash = senhaHash;
        this.papel = papel;
    }

    public void alterarSenha(String novaSenhaHash) {
        this.senhaHash = novaSenhaHash;
    }

    public void alterarDados(
            String nome,
            String telefone) {

        this.nome = nome;
        this.telefone = telefone;
    }

    public void alterarEmail(String email) {

        this.email = email;
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

    public String getEmail() {
        return email;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public PapelUsuario getPapel() {
        return papel;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public boolean isEmailVerificado() {
        return emailVerificado;
    }

    public int getTentativasLogin() {
        return tentativasLogin;
    }

    public LocalDateTime getBloqueadoAte() {
        return bloqueadoAte;
    }

    public LocalDateTime getUltimoLoginEm() {
        return ultimoLoginEm;
    }

    public boolean isAcessoLiberado() {
        return acessoLiberado;
    }

    public TipoAcessoUsuario getTipoAcesso() {
        return tipoAcesso;
    }

    public LocalDate getAcessoExpiraEm() {
        return acessoExpiraEm;
    }

    public StatusPagamento getStatusPagamento() {
        return statusPagamento;
    }

    public LocalDate getDataVencimentoPagamento() {
        return dataVencimentoPagamento;
    }

    public LocalDateTime getUltimoUsoEm() {
        return ultimoUsoEm;
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

    public void registrarLogin(
            LocalDateTime dataHora) {

        this.ultimoLoginEm = dataHora;
        this.ultimoUsoEm = dataHora;
        this.tentativasLogin = 0;
        this.bloqueadoAte = null;
    }

    public void alterarAcessoLiberado(
            boolean acessoLiberado) {

        this.acessoLiberado = acessoLiberado;
    }

    public void configurarAcesso(
            boolean acessoLiberado,
            TipoAcessoUsuario tipoAcesso,
            LocalDate acessoExpiraEm) {

        this.acessoLiberado = acessoLiberado;
        this.tipoAcesso = tipoAcesso;
        this.acessoExpiraEm = acessoExpiraEm;
    }

    public boolean possuiAcessoValido(LocalDate hoje) {

        if (!acessoLiberado) {
            return false;
        }

        if (tipoAcesso == TipoAcessoUsuario.PRAZO
                && acessoExpiraEm != null
                && acessoExpiraEm.isBefore(hoje)) {
            return false;
        }

        return true;
    }

    public void atualizarPagamento(
            StatusPagamento statusPagamento,
            LocalDate dataVencimentoPagamento) {

        this.statusPagamento = statusPagamento;
        this.dataVencimentoPagamento =
                dataVencimentoPagamento;
    }

    public void desativar() {
        this.ativo = false;
    }

    public void ativar() {
        this.ativo = true;
    }
}
