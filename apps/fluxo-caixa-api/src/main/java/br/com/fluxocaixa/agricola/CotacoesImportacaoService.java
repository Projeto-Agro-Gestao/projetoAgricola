package br.com.fluxocaixa.agricola;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import java.net.*;
import java.net.http.*;
import java.math.BigDecimal;
import java.time.*;
import java.util.*;

@Service
public class CotacoesImportacaoService {
    private final JdbcTemplate db;
    private final TransactionTemplate tx;
    private final String url,token;
    private final boolean automatico;
    private Instant proximaConsulta=Instant.MIN;
    private List<CotacoesController.Cotacao> cache=List.of();
    public CotacoesImportacaoService(JdbcTemplate db,PlatformTransactionManager transactionManager,
            @Value("${agro.cotacoes.url:}") String url,@Value("${agro.cotacoes.token:}") String token,
            @Value("${agro.cotacoes.automatico:false}") boolean automatico) {
        this.db=db;this.tx=new TransactionTemplate(transactionManager);this.url=url;this.token=token;this.automatico=automatico;
    }
    public boolean configurado() { return !url.isBlank(); }
    private String texto(com.fasterxml.jackson.databind.JsonNode r,String campo,int max) {
        String valor=r.path(campo).asText("").trim();
        if(valor.isEmpty() || valor.length()>max) throw new IllegalArgumentException("Formato inválido do provedor de cotações: "+campo);
        return valor;
    }
    private synchronized List<CotacoesController.Cotacao> carregar() {
        if(!configurado()) throw new IllegalArgumentException("Configure AGRO_COTACOES_URL com um provedor autorizado.");
        if(Instant.now().isBefore(proximaConsulta)) return cache;
        try {
            URI uri=URI.create(url);
            boolean local=Set.of("localhost","127.0.0.1","[::1]").contains(uri.getHost());
            if(!"https".equals(uri.getScheme()) && !(local && "http".equals(uri.getScheme()))) throw new IllegalArgumentException("O provedor de cotações deve usar HTTPS.");
            if(uri.getUserInfo()!=null) throw new IllegalArgumentException("Use AGRO_COTACOES_TOKEN para credenciais.");
            var req=HttpRequest.newBuilder(uri).timeout(Duration.ofSeconds(15)).header("Accept","application/json");
            if(!token.isBlank()) req.header("Authorization","Bearer "+token);
            var http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
            var resposta=http.send(req.GET().build(),HttpResponse.BodyHandlers.ofInputStream());
            try(var stream=resposta.body()) {
                if(resposta.statusCode()!=200) throw new IllegalArgumentException("Provedor de cotações temporariamente indisponível.");
                byte[] bytes=stream.readNBytes(512_001);
                if(bytes.length>512_000) throw new IllegalArgumentException("Resposta do provedor excede o limite permitido.");
                var array=new ObjectMapper().readTree(bytes);
                if(!array.isArray() || array.size()>1000 || array.isEmpty()) throw new IllegalArgumentException("Provedor deve retornar entre 1 e 1000 cotações.");
                List<CotacoesController.Cotacao> novas=new ArrayList<>();
                for(var item:array) {
                    BigDecimal valor=new BigDecimal(texto(item,"valor",30));
                    LocalDate data=LocalDate.parse(texto(item,"data",10));
                    if(valor.signum()<=0 || valor.scale()>4 || valor.precision()-valor.scale()>15 || data.isAfter(LocalDate.now())) throw new IllegalArgumentException("Preço ou data inválidos no provedor de cotações.");
                    novas.add(new CotacoesController.Cotacao(texto(item,"cultura",80),texto(item,"praca",100),texto(item,"unidade",30),valor,data,texto(item,"fonte",300)));
                }
                cache=List.copyOf(novas);proximaConsulta=Instant.now().plusSeconds(3600);return cache;
            }
        } catch(InterruptedException e) { Thread.currentThread().interrupt();throw new IllegalArgumentException("Consulta de cotações interrompida."); }
        catch(IllegalArgumentException e) { throw e; }
        catch(Exception e) { throw new IllegalArgumentException("Não foi possível ler as cotações do provedor configurado."); }
    }
    public int sincronizar(Long empresa) {
        var cotacoes=carregar();
        return Objects.requireNonNull(tx.execute(status->{
            // Serializa importações por empresa e mantém a atualização de todo o lote atômica.
            if(db.queryForList("SELECT id FROM empresas WHERE id=? FOR UPDATE",empresa).isEmpty()) throw new IllegalArgumentException("Empresa não encontrada.");
            int total=0;
            for(var r:cotacoes) {
                var existentes=db.queryForList("SELECT id FROM cotacoes_agricolas WHERE empresa_id=? AND cultura=? AND praca=? AND unidade=? AND data_cotacao=? AND fonte=?",empresa,r.cultura(),r.praca(),r.unidade(),r.data(),r.fonte());
                if(existentes.isEmpty()) total+=db.update("INSERT INTO cotacoes_agricolas(empresa_id,cultura,praca,unidade,valor,data_cotacao,fonte) VALUES(?,?,?,?,?,?,?)",empresa,r.cultura(),r.praca(),r.unidade(),r.valor(),r.data(),r.fonte());
            }
            return total;
        }));
    }
    @Scheduled(fixedDelayString="${agro.cotacoes.intervalo-ms:3600000}",initialDelay=60000)
    public void atualizarAutomaticamente() {
        if(!automatico || !configurado()) return;
        for(Long empresa:db.queryForList("SELECT id FROM empresas WHERE ativo=true",Long.class)) {
            try { sincronizar(empresa); } catch(Exception e) {
                org.slf4j.LoggerFactory.getLogger(getClass()).warn("Falha ao atualizar cotações da empresa {}. Verifique configuração e disponibilidade do provedor.",empresa);
            }
        }
    }
}
