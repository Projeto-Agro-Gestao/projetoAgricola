package br.com.fluxocaixa.integracaooficial;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDateTime;

@Entity
@Table(name = "official_cnpj_cache")
public class OfficialCnpjCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 14)
    private String cnpj;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private OfficialCnpjProviderType provider;

    @Column(name = "razao_social", length = 255)
    private String razaoSocial;

    @Column(name = "nome_fantasia", length = 255)
    private String nomeFantasia;

    @Column(name = "situacao_cadastral", length = 80)
    private String situacaoCadastral;

    @Column(name = "natureza_juridica", length = 120)
    private String naturezaJuridica;

    @Column(length = 80)
    private String porte;

    @Column(name = "cnae_principal", length = 120)
    private String cnaePrincipal;

    @Column(length = 150)
    private String logradouro;

    @Column(length = 30)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 12)
    private String cep;

    @Column(length = 100)
    private String municipio;

    @Column(length = 2)
    private String uf;

    @Column(length = 255)
    private String fonte;

    @Column(name = "consultado_em", nullable = false)
    private LocalDateTime consultadoEm;

    protected OfficialCnpjCache() {
    }

    public OfficialCnpjCache(CnpjOfficialDataResponse dados) {
        atualizar(dados);
    }

    public void atualizar(CnpjOfficialDataResponse dados) {
        this.cnpj = dados.cnpj();
        this.provider = dados.provider();
        this.razaoSocial = dados.razaoSocial();
        this.nomeFantasia = dados.nomeFantasia();
        this.situacaoCadastral = dados.situacaoCadastral();
        this.naturezaJuridica = dados.naturezaJuridica();
        this.porte = dados.porte();
        this.cnaePrincipal = dados.cnaePrincipal();
        this.logradouro = dados.logradouro();
        this.numero = dados.numero();
        this.complemento = dados.complemento();
        this.bairro = dados.bairro();
        this.cep = dados.cep();
        this.municipio = dados.municipio();
        this.uf = dados.uf();
        this.fonte = dados.fonte();
        this.consultadoEm = dados.dataConsulta();
    }

    public CnpjOfficialDataResponse toResponse(boolean cache) {
        return new CnpjOfficialDataResponse(
                cnpj,
                razaoSocial,
                nomeFantasia,
                situacaoCadastral,
                null,
                naturezaJuridica,
                porte,
                cnaePrincipal,
                java.util.List.of(),
                logradouro,
                numero,
                complemento,
                bairro,
                cep,
                municipio,
                uf,
                provider,
                fonte,
                consultadoEm,
                cache
        );
    }

    public LocalDateTime getConsultadoEm() {
        return consultadoEm;
    }
}
