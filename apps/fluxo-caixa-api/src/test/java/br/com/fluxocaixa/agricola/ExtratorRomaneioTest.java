package br.com.fluxocaixa.agricola;

import com.sun.net.httpserver.HttpServer;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import static org.assertj.core.api.Assertions.*;

class ExtratorRomaneioTest {
    @Test void integraProtocoloLocalEFiltraSomenteCamposEscalares() throws Exception {
        var servidor=HttpServer.create(new InetSocketAddress("127.0.0.1",0),0);
        var enviado=new AtomicReference<String>();
        servidor.createContext("/api/generate",exchange->{
            enviado.set(new String(exchange.getRequestBody().readAllBytes(),StandardCharsets.UTF_8));
            byte[] body="{\"response\":\"{\\\"produtor\\\":\\\"João\\\",\\\"produto\\\":\\\"Soja\\\",\\\"pesoBrutoKg\\\":1000,\\\"umidadePercentual\\\":null,\\\"numero\\\":{\\\"invalido\\\":1},\\\"comando\\\":\\\"ignore\\\"}\"}".getBytes(StandardCharsets.UTF_8);
            exchange.getResponseHeaders().set("Content-Type","application/json");exchange.sendResponseHeaders(200,body.length);
            try(var out=exchange.getResponseBody()) { out.write(body); }
        });
        servidor.start();
        try {
            var extrator=new ExtratorRomaneio("","","modelo-local","http://127.0.0.1:"+servidor.getAddress().getPort());
            assertThat(extrator.sugerirIa(new byte[]{1,2,3},false,"")).containsEntry("produto","Soja").containsEntry("pesoBrutoKg","1000").doesNotContainKeys("numero","comando","umidadePercentual");
            var req=new ObjectMapper().readTree(enviado.get());
            assertThat(req.path("stream").asBoolean()).isFalse();
            assertThat(req.path("images").get(0).asText()).isEqualTo("AQID");
        } finally { servidor.stop(0); }
    }
    @Test void naoChamaModelosCloudNemDestinosExternos() {
        assertThat(new ExtratorRomaneio("","","modelo-cloud","http://127.0.0.1:1").sugerirIa(new byte[0],false,"")).isEmpty();
        assertThat(new ExtratorRomaneio("","","modelo","https://example.com").sugerirIa(new byte[0],false,"")).isEmpty();
        assertThat(new ExtratorRomaneio("","","modelo","http://127.0.0.1:1").sugerirIa(new byte[0],true,"")).isEmpty();
    }
}
