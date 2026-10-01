package br.com.fluxocaixa.integracaooficial;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

@ConfigurationProperties(prefix = "official")
public class OfficialIntegrationProperties {

    private final Cnpj cnpj = new Cnpj();
    private final TaxRules taxRules = new TaxRules();

    public Cnpj getCnpj() {
        return cnpj;
    }

    public TaxRules getTaxRules() {
        return taxRules;
    }

    public static class Cnpj {

        private OfficialCnpjProviderType provider =
                OfficialCnpjProviderType.DISABLED;
        private Duration cacheTtl = Duration.ofDays(7);
        private String baseUrl = "";
        private String tokenUrl = "";
        private String consumerKey = "";
        private String consumerSecret = "";
        private String certificatePath = "";
        private String certificatePassword = "";
        private String cnpjPathTemplate = "/v1/cnpj/{cnpj}";

        public OfficialCnpjProviderType getProvider() {
            return provider;
        }

        public void setProvider(OfficialCnpjProviderType provider) {
            this.provider = provider == null
                    ? OfficialCnpjProviderType.DISABLED
                    : provider;
        }

        public Duration getCacheTtl() {
            return cacheTtl;
        }

        public void setCacheTtl(Duration cacheTtl) {
            this.cacheTtl = cacheTtl == null
                    ? Duration.ofDays(7)
                    : cacheTtl;
        }

        public String getBaseUrl() {
            return baseUrl;
        }

        public void setBaseUrl(String baseUrl) {
            this.baseUrl = limpar(baseUrl);
        }

        public String getTokenUrl() {
            return tokenUrl;
        }

        public void setTokenUrl(String tokenUrl) {
            this.tokenUrl = limpar(tokenUrl);
        }

        public String getConsumerKey() {
            return consumerKey;
        }

        public void setConsumerKey(String consumerKey) {
            this.consumerKey = limpar(consumerKey);
        }

        public String getConsumerSecret() {
            return consumerSecret;
        }

        public void setConsumerSecret(String consumerSecret) {
            this.consumerSecret = limpar(consumerSecret);
        }

        public String getCertificatePath() {
            return certificatePath;
        }

        public void setCertificatePath(String certificatePath) {
            this.certificatePath = limpar(certificatePath);
        }

        public String getCertificatePassword() {
            return certificatePassword;
        }

        public void setCertificatePassword(String certificatePassword) {
            this.certificatePassword = limpar(certificatePassword);
        }

        public String getCnpjPathTemplate() {
            return cnpjPathTemplate;
        }

        public void setCnpjPathTemplate(String cnpjPathTemplate) {
            this.cnpjPathTemplate = cnpjPathTemplate == null
                    || cnpjPathTemplate.isBlank()
                    ? "/v1/cnpj/{cnpj}"
                    : cnpjPathTemplate.trim();
        }

        public boolean hasSerproCredentials() {
            return !consumerKey.isBlank()
                    && !consumerSecret.isBlank()
                    && !baseUrl.isBlank()
                    && !tokenUrl.isBlank();
        }
    }

    public static class TaxRules {

        private boolean syncEnabled = false;

        public boolean isSyncEnabled() {
            return syncEnabled;
        }

        public void setSyncEnabled(boolean syncEnabled) {
            this.syncEnabled = syncEnabled;
        }
    }

    private static String limpar(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
