package br.com.fluxocaixa.integracaooficial;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(OfficialIntegrationProperties.class)
public class OfficialIntegrationConfiguration {
}
