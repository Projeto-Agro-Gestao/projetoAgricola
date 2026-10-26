package br.com.fluxocaixa.agricola;
import java.math.BigDecimal;
import java.nio.charset.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Pattern;

public final class ExtratoOfxParser {
    private ExtratoOfxParser() {}
    private static String tag(String texto,String nome) {
        var m=Pattern.compile("(?is)<"+nome+"\\s*>([^<\\r\\n]*)").matcher(texto);
        return m.find() ? m.group(1).trim().replace("&amp;","&").replace("&lt;","<").replace("&gt;",">") : "";
    }
    public static RecursosAgroController.Extrato ler(byte[] bytes) {
        if(bytes.length==0 || bytes.length>2_000_000) throw new IllegalArgumentException("Envie um OFX com até 2 MB.");
        String texto=new String(bytes,StandardCharsets.UTF_8);
        if(texto.contains("\uFFFD")) texto=new String(bytes,Charset.forName("windows-1252"));
        if(!texto.toUpperCase(Locale.ROOT).contains("<OFX>") || texto.toUpperCase(Locale.ROOT).contains("<!DOCTYPE") || texto.toUpperCase(Locale.ROOT).contains("<!ENTITY")) throw new IllegalArgumentException("OFX inválido ou com declarações externas não permitidas.");
        if(Pattern.compile("(?i)<ACCTID\\s*>").matcher(texto).results().count()!=1) throw new IllegalArgumentException("Importe um OFX de uma única conta por vez.");
        String conta=tag(texto,"ACCTID"),banco=tag(texto,"BANKID");
        if(conta.isBlank()) throw new IllegalArgumentException("OFX sem identificação da conta.");
        String identificacao=(banco.isBlank() ? "" : banco+"/")+conta;
        if(identificacao.length()>100) throw new IllegalArgumentException("Identificação de conta OFX muito longa.");
        List<RecursosAgroController.LinhaExtrato> linhas=new ArrayList<>();
        var blocos=Pattern.compile("(?is)<STMTTRN\\s*>(.*?)</STMTTRN\\s*>").matcher(texto);
        while(blocos.find()) {
            if(linhas.size()>=500) throw new IllegalArgumentException("OFX excede 500 lançamentos. Divida o período do extrato.");
            String bloco=blocos.group(1),fitid=tag(bloco,"FITID"),data=tag(bloco,"DTPOSTED"),valor=tag(bloco,"TRNAMT");
            if(fitid.isBlank()||fitid.length()>100||data.length()<8) throw new IllegalArgumentException("Lançamento OFX sem referência ou data válida.");
            LocalDate dia; BigDecimal quantia;
            try { dia=LocalDate.parse(data.substring(0,8),DateTimeFormatter.BASIC_ISO_DATE);quantia=new BigDecimal(valor); }
            catch(Exception e) { throw new IllegalArgumentException("Data ou valor inválidos no OFX."); }
            if(dia.isAfter(LocalDate.now())||quantia.signum()==0||quantia.scale()>2||quantia.precision()-quantia.scale()>17) throw new IllegalArgumentException("Data ou valor fora do permitido no OFX.");
            String descricao=tag(bloco,"NAME");if(descricao.isBlank()) descricao=tag(bloco,"MEMO");if(descricao.isBlank()) descricao="Lançamento OFX "+fitid;
            linhas.add(new RecursosAgroController.LinhaExtrato(fitid,descricao.substring(0,Math.min(150,descricao.length())),dia,quantia));
        }
        if(linhas.isEmpty()) throw new IllegalArgumentException("OFX sem lançamentos reconhecidos.");
        if(Pattern.compile("(?i)<STMTTRN\\s*>").matcher(texto).results().count()!=linhas.size()) throw new IllegalArgumentException("OFX incompleto: há lançamentos sem fechamento. Nenhuma linha foi importada.");
        return new RecursosAgroController.Extrato(identificacao,List.copyOf(linhas));
    }
}
