package br.com.fluxocaixa.busca;

import br.com.fluxocaixa.autenticacao.AcessoUsuarioAuthorizationManager;
import br.com.fluxocaixa.colaboracao.ContadorEmpresaRepository;
import br.com.fluxocaixa.colaboracao.DocumentoAgro;
import br.com.fluxocaixa.colaboracao.PropriedadeRural;
import br.com.fluxocaixa.colaboracao.StatusVinculoContador;
import br.com.fluxocaixa.contafinanceira.ContaFinanceira;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.fornecedor.Fornecedor;
import br.com.fluxocaixa.movimentacao.Movimentacao;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import jakarta.persistence.EntityManager;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class BuscaGlobalService {

    private static final int LIMITE_POR_TIPO = 5;
    private static final int LIMITE_TERMO = 100;

    private final EntityManager entityManager;
    private final AcessoUsuarioAuthorizationManager acessoUsuario;
    private final EmpresaRepository empresaRepository;
    private final ContadorEmpresaRepository contadorEmpresaRepository;

    public BuscaGlobalService(
            EntityManager entityManager,
            AcessoUsuarioAuthorizationManager acessoUsuario,
            EmpresaRepository empresaRepository,
            ContadorEmpresaRepository contadorEmpresaRepository) {
        this.entityManager = entityManager;
        this.acessoUsuario = acessoUsuario;
        this.empresaRepository = empresaRepository;
        this.contadorEmpresaRepository = contadorEmpresaRepository;
    }

    @Transactional(readOnly = true)
    public List<BuscaGlobalItemResponse> buscar(Long empresaId, String termo) {
        Usuario usuario = acessoUsuario.usuarioAtual();
        validarAcesso(usuario, empresaId);
        if (!empresaRepository.existsById(empresaId)) {
            throw new EmpresaNaoEncontradaException(empresaId);
        }

        if (termo == null || termo.isBlank()) return List.of();
        String normalizado = termo.trim();
        if (normalizado.length() > LIMITE_TERMO) {
            normalizado = normalizado.substring(0, LIMITE_TERMO);
        }
        if (normalizado.length() < 2) return List.of();
        String padrao = "%" + normalizado.toLowerCase(Locale.ROOT) + "%";

        List<BuscaGlobalItemResponse> resultados = new ArrayList<>();
        buscarEntidades(Movimentacao.class, """
                SELECT m FROM Movimentacao m
                WHERE m.empresa.id = :empresaId
                  AND m.excluida = false
                  AND (lower(m.descricao) LIKE :termo
                    OR lower(coalesce(m.observacao, '')) LIKE :termo
                    OR lower(coalesce(m.fornecedorNome, '')) LIKE :termo
                    OR lower(coalesce(m.produtoNome, '')) LIKE :termo)
                ORDER BY m.dataMovimentacao DESC, m.id DESC
                """, empresaId, padrao).forEach(m -> resultados.add(new BuscaGlobalItemResponse(
                "MOVIMENTACAO", m.getId(), m.getDescricao(),
                m.getTipo() + " · " + dinheiro(m.getValor()) + " · " + m.getDataMovimentacao(),
                "/dashboard/movimentacoes")));

        buscarEntidades(ContaFinanceira.class, """
                SELECT c FROM ContaFinanceira c
                WHERE c.empresa.id = :empresaId
                  AND c.excluida = false
                  AND (lower(c.descricao) LIKE :termo
                    OR lower(coalesce(c.favorecido, '')) LIKE :termo
                    OR lower(coalesce(c.numeroDocumento, '')) LIKE :termo
                    OR lower(coalesce(c.fornecedorNome, '')) LIKE :termo)
                ORDER BY c.dataVencimento DESC, c.id DESC
                """, empresaId, padrao).forEach(c -> resultados.add(new BuscaGlobalItemResponse(
                "CONTA", c.getId(), c.getDescricao(),
                (c.getFavorecido() == null ? c.getTipo().name() : c.getFavorecido())
                        + " · " + dinheiro(c.getValorPendente()) + " · vence " + c.getDataVencimento(),
                "/dashboard/contas")));

        buscarEntidades(Fornecedor.class, """
                SELECT f FROM Fornecedor f
                WHERE f.empresa.id = :empresaId
                  AND f.excluido = false
                  AND f.ativo = true
                  AND (lower(f.nome) LIKE :termo
                    OR lower(coalesce(f.nomeFantasia, '')) LIKE :termo
                    OR lower(coalesce(f.razaoSocial, '')) LIKE :termo
                    OR lower(coalesce(f.documento, '')) LIKE :termo)
                ORDER BY f.nome ASC, f.id ASC
                """, empresaId, padrao).forEach(f -> resultados.add(new BuscaGlobalItemResponse(
                "FORNECEDOR", f.getId(), f.getNome(),
                f.getDocumento() == null ? "Fornecedor" : "Documento: " + f.getDocumento(),
                "/dashboard/fornecedores")));

        buscarEntidades(DocumentoAgro.class, """
                SELECT d FROM DocumentoAgro d
                WHERE d.empresa.id = :empresaId
                  AND (lower(d.nomeArquivo) LIKE :termo
                    OR lower(coalesce(d.observacao, '')) LIKE :termo)
                ORDER BY d.criadoEm DESC, d.id DESC
                """, empresaId, padrao).forEach(d -> resultados.add(new BuscaGlobalItemResponse(
                "DOCUMENTO", d.getId(), d.getNomeArquivo(),
                d.getTipoDocumento().name() + " · " + d.getStatus().name(),
                "/dashboard/produtor")));

        buscarEntidades(PropriedadeRural.class, """
                SELECT p FROM PropriedadeRural p
                WHERE p.empresa.id = :empresaId
                  AND p.ativa = true
                  AND (lower(p.nome) LIKE :termo
                    OR lower(coalesce(p.municipio, '')) LIKE :termo)
                ORDER BY p.nome ASC, p.id ASC
                """, empresaId, padrao).forEach(p -> resultados.add(new BuscaGlobalItemResponse(
                "PROPRIEDADE", p.getId(), p.getNome(),
                p.getMunicipio() == null ? "Propriedade rural" : p.getMunicipio(),
                "/dashboard/produtor")));

        return resultados;
    }

    private <T> List<T> buscarEntidades(
            Class<T> tipo,
            String jpql,
            Long empresaId,
            String termo) {
        return entityManager.createQuery(jpql, tipo)
                .setParameter("empresaId", empresaId)
                .setParameter("termo", termo)
                .setMaxResults(LIMITE_POR_TIPO)
                .getResultList();
    }

    private void validarAcesso(Usuario usuario, Long empresaId) {
        if (!usuario.isAcessoLiberado()) {
            throw new AccessDeniedException("Acesso não liberado.");
        }
        if (AcessoUsuarioAuthorizationManager.isAdministrador(usuario)) return;
        if (usuario.getEmpresa() != null
                && usuario.getEmpresa().getId().equals(empresaId)) return;
        if (usuario.getPapel() == PapelUsuario.CONTADOR
                && contadorEmpresaRepository.existsByContador_IdAndEmpresa_IdAndStatus(
                        usuario.getId(), empresaId, StatusVinculoContador.ATIVO)) return;
        throw new AccessDeniedException("Você não possui acesso a esta empresa.");
    }

    private String dinheiro(BigDecimal valor) {
        return NumberFormat.getCurrencyInstance(new Locale("pt", "BR"))
                .format(valor == null ? BigDecimal.ZERO : valor);
    }
}
