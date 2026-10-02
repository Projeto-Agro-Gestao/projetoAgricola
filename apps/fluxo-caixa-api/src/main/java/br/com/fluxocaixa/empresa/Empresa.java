package br.com.fluxocaixa.empresa;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "empresas")
public class Empresa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String nome;

    @Column(length = 20, unique = true)
    private String documento;

    @Column(name = "cep_cobranca", length = 12)
    private String cepCobranca;

    @Column(name = "rua_cobranca", length = 150)
    private String ruaCobranca;

    @Column(name = "numero_cobranca", length = 20)
    private String numeroCobranca;

    @Column(name = "sem_numero_cobranca", nullable = false)
    private boolean semNumeroCobranca;

    @Column(name = "complemento_cobranca", length = 50)
    private String complementoCobranca;

    @Column(name = "bairro_cobranca", length = 100)
    private String bairroCobranca;

    @Column(name = "cidade_cobranca", length = 100)
    private String cidadeCobranca;

    @Column(name = "estado_cobranca", length = 2)
    private String estadoCobranca;

    @Column(name = "observacoes_endereco_cobranca", length = 500)
    private String observacoesEnderecoCobranca;

    @Column(name = "inscricao_estadual", length = 40)
    private String inscricaoEstadual;

    @Column(name = "isento_inscricao_estadual", nullable = false)
    private boolean isentoInscricaoEstadual = false;

    @Column(name = "inscricao_municipal", length = 40)
    private String inscricaoMunicipal;

    @Column(name = "isento_inscricao_municipal", nullable = false)
    private boolean isentoInscricaoMunicipal = false;

    @Column(nullable = false)
    private boolean ativo = true;

    @Column(
            name = "agricultura_ativa",
            nullable = false
    )
    private boolean agriculturaAtiva = true;

    @Column(
            name = "pecuaria_ativa",
            nullable = false
    )
    private boolean pecuariaAtiva = false;

    @CreationTimestamp
    @Column(
            name = "criado_em",
            nullable = false,
            updatable = false
    )
    private LocalDateTime criadoEm;

    @UpdateTimestamp
    @Column(
            name = "atualizado_em",
            nullable = false
    )
    private LocalDateTime atualizadoEm;

    protected Empresa() {
    }

    public Empresa(
            String nome,
            String documento) {

        this.nome = nome;
        this.documento = documento;
    }

    public Empresa(
            String nome,
            String documento,
            boolean agriculturaAtiva,
            boolean pecuariaAtiva) {

        this.nome = nome;
        this.documento = documento;
        this.agriculturaAtiva = agriculturaAtiva;
        this.pecuariaAtiva = pecuariaAtiva;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getDocumento() {
        return documento;
    }

    public String getCepCobranca() {
        return cepCobranca;
    }

    public String getRuaCobranca() {
        return ruaCobranca;
    }

    public String getNumeroCobranca() {
        return numeroCobranca;
    }

    public boolean isSemNumeroCobranca() {
        return semNumeroCobranca;
    }

    public String getComplementoCobranca() {
        return complementoCobranca;
    }

    public String getBairroCobranca() {
        return bairroCobranca;
    }

    public String getCidadeCobranca() {
        return cidadeCobranca;
    }

    public String getEstadoCobranca() {
        return estadoCobranca;
    }

    public String getObservacoesEnderecoCobranca() {
        return observacoesEnderecoCobranca;
    }

    public boolean isAtivo() {
        return ativo;
    }

    public boolean isAgriculturaAtiva() {
        return agriculturaAtiva;
    }

    public boolean isPecuariaAtiva() {
        return pecuariaAtiva;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }

    public LocalDateTime getAtualizadoEm() {
        return atualizadoEm;
    }

    public String getInscricaoEstadual() {
        return inscricaoEstadual;
    }

    public boolean isIsentoInscricaoEstadual() {
        return isentoInscricaoEstadual;
    }

    public String getInscricaoMunicipal() {
        return inscricaoMunicipal;
    }

    public boolean isIsentoInscricaoMunicipal() {
        return isentoInscricaoMunicipal;
    }

    public void alterarNome(String nome) {
        this.nome = nome;
    }

    public void alterarDocumento(String documento) {
        this.documento = documento;
    }

    public void alterarDadosFiscais(
            String documento,
            String inscricaoEstadual,
            boolean isentoInscricaoEstadual,
            String inscricaoMunicipal,
            boolean isentoInscricaoMunicipal) {

        this.documento = documento;
        this.isentoInscricaoEstadual = isentoInscricaoEstadual;
        this.inscricaoEstadual = isentoInscricaoEstadual ? null : inscricaoEstadual;
        this.isentoInscricaoMunicipal = isentoInscricaoMunicipal;
        this.inscricaoMunicipal = isentoInscricaoMunicipal ? null : inscricaoMunicipal;
    }

    public void alterarDadosCobranca(
            String documento,
            String cepCobranca,
            String ruaCobranca,
            String numeroCobranca,
            boolean semNumeroCobranca,
            String complementoCobranca,
            String bairroCobranca,
            String cidadeCobranca,
            String estadoCobranca,
            String observacoesEnderecoCobranca) {

        this.documento = documento;
        this.cepCobranca = cepCobranca;
        this.ruaCobranca = ruaCobranca;
        this.numeroCobranca = numeroCobranca;
        this.semNumeroCobranca = semNumeroCobranca;
        this.complementoCobranca = complementoCobranca;
        this.bairroCobranca = bairroCobranca;
        this.cidadeCobranca = cidadeCobranca;
        this.estadoCobranca = estadoCobranca;
        this.observacoesEnderecoCobranca = observacoesEnderecoCobranca;
    }

    public void configurarAtividades(
            boolean agriculturaAtiva,
            boolean pecuariaAtiva) {

        if (!agriculturaAtiva && !pecuariaAtiva) {
            throw new IllegalArgumentException(
                    "Escolha Agricultura (plantação), "
                            + "Pecuária (animais) ou as duas atividades"
            );
        }

        this.agriculturaAtiva = agriculturaAtiva;
        this.pecuariaAtiva = pecuariaAtiva;
    }

    public void desativar() {
        this.ativo = false;
    }

    public void ativar() {
        this.ativo = true;
    }
}
