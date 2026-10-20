package br.com.fluxocaixa.agricola;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.*;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;

@RestController
@RequestMapping("/api/v1/empresas/{empresaId}/agricola/propriedades/{propriedadeId}")
public class ClimaController {
    private final AgricolaService acesso;
    private final JdbcTemplate db;
    private final String identificacao;
    private final HttpClient http=HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private final Map<String,Cache> cache=new LinkedHashMap<>();
    private record Cache(Instant expira, Map<String,Object> dados) {}
    public record Localizacao(@NotNull @DecimalMin("-90") @DecimalMax("90") @Digits(integer=3,fraction=4) BigDecimal latitude,
            @NotNull @DecimalMin("-180") @DecimalMax("180") @Digits(integer=3,fraction=4) BigDecimal longitude) {}
    public ClimaController(AgricolaService acesso,JdbcTemplate db,@Value("${agro.clima.user-agent:}") String identificacao) {
        this.acesso=acesso;this.db=db;this.identificacao=identificacao;
    }
    @PutMapping("/localizacao")
    public Map<String,Object> localizar(@PathVariable Long empresaId,@PathVariable Long propriedadeId,@Valid @RequestBody Localizacao r) {
        acesso.escrita(empresaId);
        acesso.permissoes().propriedade(empresaId,propriedadeId);
        if(db.update("UPDATE propriedades_rurais SET latitude=?,longitude=? WHERE id=? AND empresa_id=?",r.latitude(),r.longitude(),propriedadeId,empresaId)!=1)
            throw new IllegalArgumentException("Propriedade não encontrada.");
        return Map.of("salvo",true);
    }
    @GetMapping("/clima")
    public synchronized Map<String,Object> clima(@PathVariable Long empresaId,@PathVariable Long propriedadeId) {
        acesso.acesso(empresaId);
        acesso.permissoes().propriedade(empresaId,propriedadeId);
        var propriedades=db.queryForList("SELECT latitude,longitude FROM propriedades_rurais WHERE id=? AND empresa_id=?",propriedadeId,empresaId);
        if(propriedades.isEmpty()) throw new IllegalArgumentException("Propriedade não encontrada.");
        var p=propriedades.getFirst();
        if(p.get("latitude")==null || p.get("longitude")==null) return Map.of("disponivel",false,"mensagem","Cadastre as coordenadas da propriedade.");
        if(identificacao.isBlank()) return Map.of("disponivel",false,"mensagem","Configure AGRO_CLIMA_USER_AGENT com domínio e contato da empresa.");
        String chave=p.get("latitude")+","+p.get("longitude");
        var atual=cache.get(chave);
        if(atual!=null && atual.expira().isAfter(Instant.now())) return atual.dados();
        try {
            var req=HttpRequest.newBuilder(URI.create("https://api.met.no/weatherapi/locationforecast/2.0/compact?lat="+p.get("latitude")+"&lon="+p.get("longitude")))
                    .header("User-Agent",identificacao).header("Accept-Encoding","gzip").timeout(Duration.ofSeconds(12)).GET().build();
            var resposta=http.send(req,HttpResponse.BodyHandlers.ofInputStream());
            try(var entrada=resposta.body()) {
                if(resposta.statusCode()!=200) return Map.of("disponivel",false,"mensagem","Previsão temporariamente indisponível na fonte.");
                java.io.InputStream stream=resposta.headers().firstValue("Content-Encoding").orElse("").equals("gzip") ? new java.util.zip.GZIPInputStream(entrada) : entrada;
                JsonNode dados=new ObjectMapper().readTree(stream.readNBytes(2_000_000));
                List<Map<String,Object>> horas=new ArrayList<>();
                for(var hora:dados.path("properties").path("timeseries")) {
                    if(horas.size()>=24) break;
                    var d=hora.path("data");var instante=d.path("instant").path("details");
                    Map<String,Object> item=new LinkedHashMap<>();item.put("data",hora.path("time").asText());
                    item.put("temperatura",numero(instante,"air_temperature"));item.put("umidade",numero(instante,"relative_humidity"));
                    item.put("chuvaMm",numero(d.path("next_1_hours").path("details"),"precipitation_amount"));
                    List<String> avisos=new ArrayList<>();
                    if(instante.has("air_temperature") && instante.path("air_temperature").asDouble()<=3) avisos.add("Temperatura baixa prevista");
                    if(instante.path("air_temperature").asDouble()>=35) avisos.add("Calor intenso previsto");
                    if(d.path("next_1_hours").path("details").path("precipitation_amount").asDouble()>=10) avisos.add("Chuva intensa prevista");
                    item.put("avisos",avisos);horas.add(item);
                }
                if(horas.isEmpty()) return Map.of("disponivel",false,"mensagem","Fonte sem previsão para a localização.");
                var resultado=Map.<String,Object>of("disponivel",true,"fonte","MET Norway","licenca","https://creativecommons.org/licenses/by/4.0/","consultadoEm",Instant.now().toString(),"horas",horas);
                Instant expira=Instant.now().plusSeconds(3600);
                try { expira=ZonedDateTime.parse(resposta.headers().firstValue("Expires").orElse(""),DateTimeFormatter.RFC_1123_DATE_TIME).toInstant(); } catch(Exception ignored) {}
                if(cache.size()>=1000) cache.remove(cache.keySet().iterator().next());
                cache.put(chave,new Cache(expira,resultado)); return resultado;
            }
        } catch(InterruptedException e) { Thread.currentThread().interrupt(); return Map.of("disponivel",false,"mensagem","Consulta interrompida."); }
        catch(Exception e) { return Map.of("disponivel",false,"mensagem","Não foi possível consultar a previsão. Tente mais tarde."); }
    }
    private Object numero(JsonNode node,String campo) { return node.has(campo) ? node.get(campo).decimalValue() : null; }
}
