package br.com.fluxocaixa.colaboracao;

import jakarta.persistence.Column;
import jakarta.persistence.Lob;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

class DocumentoAgroMappingTest {

    @Test
    void conteudoDeveMapearLongblobSemLob() throws NoSuchFieldException {
        Field conteudo = DocumentoAgro.class.getDeclaredField("conteudo");

        assertThat(conteudo.getAnnotation(Lob.class)).isNull();
        assertThat(conteudo.getAnnotation(JdbcTypeCode.class).value())
                .isEqualTo(SqlTypes.LONGVARBINARY);
        assertThat(conteudo.getAnnotation(Column.class).columnDefinition())
                .isEqualTo("LONGBLOB");
    }
}
