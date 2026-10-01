package br.com.fluxocaixa.integracaooficial;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tax_sources")
public class TaxSource {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 40)
    private TaxSourceType tipo;

    @Column(length = 500)
    private String url;

    @Column(name = "ato_normativo", length = 180)
    private String atoNormativo;

    @Column(name = "data_publicacao")
    private LocalDate dataPublicacao;

    @Column(name = "data_consulta")
    private LocalDateTime dataConsulta;

    @Column(name = "vigencia_inicio")
    private LocalDate vigenciaInicio;

    @Column(name = "vigencia_fim")
    private LocalDate vigenciaFim;

    protected TaxSource() {
    }
}
