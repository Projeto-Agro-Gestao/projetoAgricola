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

    @Column(name = "bairro_cobranca", length = 100)
    private String bairroCobranca;

    @Column(name = "cidade_cobranca", length = 100)
    private String cidadeCobranca;

    @Column(name = "estado_cobranca", length = 2)
    private String estadoCobranca;

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

    public String getBairroCobranca() {
        return bairroCobranca;
    }

    public String getCidadeCobranca() {
        return cidadeCobranca;
    }

    public String getEstadoCobranca() {
        return estadoCobranca;
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

    public void alterarNome(String nome) {
        this.nome = nome;
    }

    public void alterarDocumento(String documento) {
        this.documento = documento;
    }

    public void alterarDadosCobranca(
            String documento,
            String cepCobranca,
            String ruaCobranca,
            String numeroCobranca,
            String bairroCobranca,
            String cidadeCobranca,
            String estadoCobranca) {

        this.documento = documento;
        this.cepCobranca = cepCobranca;
        this.ruaCobranca = ruaCobranca;
        this.numeroCobranca = numeroCobranca;
        this.bairroCobranca = bairroCobranca;
        this.cidadeCobranca = cidadeCobranca;
        this.estadoCobranca = estadoCobranca;
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
