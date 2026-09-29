package br.com.fluxocaixa.usuario;

import br.com.fluxocaixa.assinatura.AssinaturaRepository;
import br.com.fluxocaixa.assinatura.AssinaturaService;
import br.com.fluxocaixa.categoria.CategoriaSugeridaService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UsuarioProvisionamentoService {

    private final CategoriaSugeridaService categoriaSugeridaService;
    private final AssinaturaRepository assinaturaRepository;
    private final AssinaturaService assinaturaService;

    public UsuarioProvisionamentoService(
            CategoriaSugeridaService categoriaSugeridaService,
            AssinaturaRepository assinaturaRepository,
            AssinaturaService assinaturaService) {

        this.categoriaSugeridaService = categoriaSugeridaService;
        this.assinaturaRepository = assinaturaRepository;
        this.assinaturaService = assinaturaService;
    }

    @Transactional
    public void garantirEstruturaOperacional(Usuario usuario) {

        if (usuario.getPapel() == PapelUsuario.ADMINISTRADOR
                || usuario.getPapel() == PapelUsuario.SUPER_ADMIN) {
            return;
        }

        categoriaSugeridaService.garantirCategoriasPorAtividade(
                usuario.getEmpresa(),
                usuario.getEmpresa().isAgriculturaAtiva(),
                usuario.getEmpresa().isPecuariaAtiva()
        );

        if (assinaturaRepository
                .findByEmpresa_Id(usuario.getEmpresa().getId())
                .isEmpty()) {
            assinaturaService.iniciarAssinaturaParaNovaEmpresa(
                    usuario.getEmpresa()
            );
        }
    }
}
