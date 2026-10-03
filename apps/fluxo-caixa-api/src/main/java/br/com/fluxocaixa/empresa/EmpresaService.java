package br.com.fluxocaixa.empresa;

import br.com.fluxocaixa.autenticacao.AcessoUsuarioAuthorizationManager;
import br.com.fluxocaixa.colaboracao.ContadorEmpresa;
import br.com.fluxocaixa.colaboracao.ContadorEmpresaRepository;
import br.com.fluxocaixa.colaboracao.StatusVinculoContador;
import br.com.fluxocaixa.usuario.PapelUsuario;
import br.com.fluxocaixa.usuario.Usuario;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;
    private final AcessoUsuarioAuthorizationManager acessoUsuario;
    private final ContadorEmpresaRepository contadorEmpresaRepository;

    public EmpresaService(EmpresaRepository empresaRepository,
                         AcessoUsuarioAuthorizationManager acessoUsuario,
                         ContadorEmpresaRepository contadorEmpresaRepository) {
        this.empresaRepository = empresaRepository;
        this.acessoUsuario = acessoUsuario;
        this.contadorEmpresaRepository = contadorEmpresaRepository;
    }

    @Transactional
    public EmpresaResponse criar(CriarEmpresaRequest request) {

        Usuario executor = acessoUsuario.usuarioAtual();
        if (!AcessoUsuarioAuthorizationManager.isAdministrador(executor)
                || !executor.isAcessoLiberado()) {
            throw new AccessDeniedException("Acesso administrativo negado.");
        }

        String nome = request.nome().trim();
        String documento = normalizarDocumento(request.documento());

        if (documento != null &&
                empresaRepository.existsByDocumento(documento)) {

            throw new DocumentoJaCadastradoException(documento);
        }

        Empresa empresa = new Empresa(nome, documento);
        Empresa empresaSalva = empresaRepository.save(empresa);

        return EmpresaResponse.de(empresaSalva);
    }

    @Transactional(readOnly = true)
    public List<EmpresaResponse> listar() {
        Usuario usuario = acessoUsuario.usuarioAtual();
        if (!usuario.isAcessoLiberado()) {
            throw new AccessDeniedException("Acesso negado.");
        }
        if (AcessoUsuarioAuthorizationManager.isAdministrador(usuario)) {
            return empresaRepository.findAll().stream().map(EmpresaResponse::de).toList();
        }
        Map<Long, Empresa> empresas = new LinkedHashMap<>();
        if (usuario.getEmpresa() != null) {
            empresas.put(usuario.getEmpresa().getId(), usuario.getEmpresa());
        }
        if (usuario.getPapel() == PapelUsuario.CONTADOR) {
            contadorEmpresaRepository.findAllByContador_IdAndStatusOrderByEmpresa_NomeAsc(
                    usuario.getId(), StatusVinculoContador.ATIVO)
                    .stream().map(ContadorEmpresa::getEmpresa)
                    .forEach(empresa -> empresas.put(empresa.getId(), empresa));
        }
        return empresas.values()
                .stream()
                .map(EmpresaResponse::de)
                .toList();
    }

    private String normalizarDocumento(String documento) {

        if (documento == null || documento.isBlank()) {
            return null;
        }

        return documento.replaceAll("[^a-zA-Z0-9]", "");
    }
}
