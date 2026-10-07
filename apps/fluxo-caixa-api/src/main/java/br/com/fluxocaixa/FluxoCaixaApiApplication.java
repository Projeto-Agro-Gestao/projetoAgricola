package br.com.fluxocaixa;

import jakarta.annotation.PostConstruct;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

import java.util.TimeZone;

@SpringBootApplication
@ConfigurationPropertiesScan
public class FluxoCaixaApiApplication {

    public static void main(String[] args) {

        SpringApplication.run(
                FluxoCaixaApiApplication.class,
                args
        );
    }

    /**
     * Fixa o fuso horário padrão da aplicação em America/Sao_Paulo.
     *
     * Sem isso, LocalDate.now()/LocalDateTime.now() sem zona explícita usam
     * o fuso da JVM (UTC em produção, ex.: Render), fazendo contas que vencem
     * "hoje" no horário de Brasília aparecerem como vencidas quando o servidor
     * já virou o dia em UTC. Padronizar o fuso corrige isso de forma global.
     */
    @PostConstruct
    void configurarFusoHorarioPadrao() {
        TimeZone.setDefault(
                TimeZone.getTimeZone("America/Sao_Paulo")
        );
    }
}
