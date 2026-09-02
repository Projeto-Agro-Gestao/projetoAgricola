package br.com.fluxocaixa.empresa;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmpresaService {

    private final EmpresaRepository empresaRepository;

    public EmpresaService(EmpresaRepository empresaRepository) {
        this.empresaRepository = empresaRepository;
    }

    @Transactional
    public EmpresaResponse criar(CriarEmpresaRequest request) {

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
        return empresaRepository.findAll()
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