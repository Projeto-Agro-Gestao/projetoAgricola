package br.com.fluxocaixa.integration.asaas;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(AsaasProperties.class)
public class AsaasConfig {
}
