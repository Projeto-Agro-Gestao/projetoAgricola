package br.com.fluxocaixa.comum.documento;

public final class DocumentoFiscalValidator {

    private DocumentoFiscalValidator() {
    }

    public static String normalizar(String valor) {
        return valor == null ? "" : valor.replaceAll("[^0-9]", "");
    }

    public static boolean cpfValido(String valor) {
        String cpf = normalizar(valor);

        if (cpf.length() != 11 || digitosRepetidos(cpf)) {
            return false;
        }

        int primeiro = digito(cpf.substring(0, 9), 10);
        int segundo = digito(cpf.substring(0, 9) + primeiro, 11);

        return cpf.equals(cpf.substring(0, 9) + primeiro + segundo);
    }

    public static boolean cnpjValido(String valor) {
        String cnpj = normalizar(valor);

        if (cnpj.length() != 14 || digitosRepetidos(cnpj)) {
            return false;
        }

        int primeiro = digitoCnpj(cnpj.substring(0, 12), new int[] {
                5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
        });
        int segundo = digitoCnpj(cnpj.substring(0, 12) + primeiro, new int[] {
                6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2
        });

        return cnpj.equals(cnpj.substring(0, 12) + primeiro + segundo);
    }

    private static boolean digitosRepetidos(String valor) {
        return valor.chars().distinct().count() == 1;
    }

    private static int digito(String base, int pesoInicial) {
        int soma = 0;
        for (int indice = 0; indice < base.length(); indice++) {
            soma += Character.digit(base.charAt(indice), 10)
                    * (pesoInicial - indice);
        }

        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }

    private static int digitoCnpj(String base, int[] pesos) {
        int soma = 0;
        for (int indice = 0; indice < base.length(); indice++) {
            soma += Character.digit(base.charAt(indice), 10) * pesos[indice];
        }

        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
