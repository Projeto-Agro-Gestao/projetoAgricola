package br.com.fluxocaixa.agricola;

import java.math.BigDecimal;
import java.math.RoundingMode;

public final class PesoRomaneio {
    private PesoRomaneio() {}
    // Descontos em kg são informados após conferência; umidade é apenas uma medição.
    // Não inventar uma tabela comercial de desconto por umidade.
    public static BigDecimal liquido(BigDecimal bruto, BigDecimal impurezas, BigDecimal desconto) {
        return liquido(bruto,BigDecimal.ZERO,impurezas,desconto);
    }
    public static BigDecimal liquido(BigDecimal bruto,BigDecimal tara,BigDecimal impurezas,BigDecimal desconto) {
        if (bruto == null || impurezas == null || desconto == null || bruto.signum() < 0
                || impurezas.signum() < 0 || impurezas.compareTo(new BigDecimal("100")) > 0
                || desconto.signum() < 0) throw new IllegalArgumentException("Pesos ou impurezas inválidos.");
        if(tara==null || tara.signum()<0 || tara.compareTo(bruto)>0) throw new IllegalArgumentException("A tara deve ser positiva ou zero e não pode exceder o peso bruto.");
        BigDecimal liquido = bruto.subtract(tara).multiply(BigDecimal.ONE.subtract(impurezas.movePointLeft(2))).subtract(desconto);
        if (liquido.signum() < 0) throw new IllegalArgumentException("Descontos excedem o peso disponível.");
        return liquido.setScale(3, RoundingMode.HALF_UP);
    }
}
