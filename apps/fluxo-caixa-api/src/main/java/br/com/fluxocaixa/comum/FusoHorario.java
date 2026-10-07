package br.com.fluxocaixa.comum;

import java.time.LocalDate;
import java.time.ZoneId;

/**
 * Fuso de negócio (Brasília) para calcular "hoje".
 *
 * Não usamos TimeZone.setDefault: o banco/Hibernate trabalham em UTC
 * (hibernate.jdbc.time_zone=UTC) e mudar o fuso da JVM faz as datas lidas
 * do banco voltarem 1 dia.
 */
public final class FusoHorario {

    public static final ZoneId BRASILIA = ZoneId.of("America/Sao_Paulo");

    private FusoHorario() {
    }

    public static LocalDate hoje() {
        return LocalDate.now(BRASILIA);
    }
}
