package br.com.fluxocaixa.integration.asaas;

public class AsaasException extends RuntimeException {

    private final Integer statusCode;
    private final String responseBody;

    public AsaasException(String mensagem) {
        super(mensagem);
        this.statusCode = null;
        this.responseBody = null;
    }

    public AsaasException(String mensagem, Throwable causa) {
        super(mensagem, causa);
        this.statusCode = null;
        this.responseBody = null;
    }

    public AsaasException(
            String mensagem,
            Integer statusCode,
            String responseBody) {

        super(mensagem);
        this.statusCode = statusCode;
        this.responseBody = responseBody;
    }

    public Integer getStatusCode() {
        return statusCode;
    }

    public boolean contemCodigo(String codigo) {
        if (responseBody == null || codigo == null) return false;
        try {
            var erros = new com.fasterxml.jackson.databind.ObjectMapper().readTree(responseBody).path("errors");
            if (!erros.isArray()) return false;
            for (var erro : erros) {
                if (codigo.equals(erro.path("code").asText())) return true;
            }
        } catch (java.io.IOException exception) {
            // Nunca devolver corpo bruto, que pode conter dados pessoais ou credenciais.
        }
        return false;
    }

    public String mensagemParaUsuario() {
        if (statusCode == null) return getMessage();
        if (statusCode == 401) return "O Asaas recusou a chave da integracao. O administrador deve conferir ASAAS_API_KEY e o ambiente configurado no Render.";
        if (statusCode == 403) return "O Asaas bloqueou a integracao. Verifique permissoes da chave, restricoes de IP e situacao da conta Asaas.";
        if (statusCode == 429) return "Limite de consultas do Asaas atingido. Aguarde antes de tentar novamente.";
        if (contemCodigo("invalid_customer")) return "O cliente de cobranca nao foi encontrado no ambiente Asaas configurado.";
        if (contemCodigo("invalid_value")) return "O Asaas recusou o valor da cobranca. Confira o preco do plano e os limites da conta Asaas.";
        if (contemCodigo("invalid_cpfCnpj")) return "O Asaas recusou o CPF ou CNPJ dos dados para pagamento.";
        if (statusCode == 400 || statusCode == 422) return "O Asaas recusou os dados da cobranca. Revise CPF/CNPJ, endereco, valor do plano e habilitacao de Pix/boleto na conta Asaas.";
        return "O servico de pagamentos Asaas esta indisponivel. Tente novamente mais tarde.";
    }
}
