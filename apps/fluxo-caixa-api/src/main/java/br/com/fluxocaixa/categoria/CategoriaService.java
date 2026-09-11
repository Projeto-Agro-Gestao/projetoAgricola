package br.com.fluxocaixa.categoria;

import br.com.fluxocaixa.empresa.Empresa;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.empresa.EmpresaRepository;
import br.com.fluxocaixa.contafinanceira.ContaFinanceiraRepository;
import br.com.fluxocaixa.movimentacao.MovimentacaoRepository;
import br.com.fluxocaixa.movimentacao.TipoMovimentacao;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class CategoriaService {

    private static final DateTimeFormatter
            FORMATADOR_DATA =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CategoriaRepository categoriaRepository;
    private final EmpresaRepository empresaRepository;
    private final MovimentacaoRepository movimentacaoRepository;
    private final ContaFinanceiraRepository contaFinanceiraRepository;

    public CategoriaService(
            CategoriaRepository categoriaRepository,
            EmpresaRepository empresaRepository,
            MovimentacaoRepository movimentacaoRepository,
            ContaFinanceiraRepository contaFinanceiraRepository) {

        this.categoriaRepository = categoriaRepository;
        this.empresaRepository = empresaRepository;
        this.movimentacaoRepository = movimentacaoRepository;
        this.contaFinanceiraRepository = contaFinanceiraRepository;
    }

    @Transactional
    public CategoriaResponse criar(
            Long empresaId,
            CriarCategoriaRequest request) {

        Empresa empresa = empresaRepository.findById(empresaId)
                .orElseThrow(
                        () -> new EmpresaNaoEncontradaException(
                                empresaId
                        )
                );

        String nome = normalizarNome(request.nome());
        TipoMovimentacao tipo = request.tipo();
        AreaCategoria area =
                normalizarArea(request.area());

        verificarCategoriaDuplicada(
                empresaId,
                nome,
                tipo
        );

        Categoria categoria = new Categoria(
                empresa,
                nome,
                tipo,
                area
        );

        Categoria categoriaSalva =
                categoriaRepository.save(categoria);

        return CategoriaResponse.de(categoriaSalva);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listar(
            Long empresaId,
            TipoMovimentacao tipo) {

        verificarEmpresa(empresaId);

        List<Categoria> categorias;

        if (tipo == null) {
            categorias =
                    categoriaRepository
                            .findAllByEmpresa_IdAndAtivoTrueOrderByNomeAsc(
                                    empresaId
                            );
        } else {
            categorias =
                    categoriaRepository
                            .findAllByEmpresa_IdAndTipoAndAtivoTrueOrderByNomeAsc(
                                    empresaId,
                                    tipo
                            );
        }

        return converterParaListaDeResponse(categorias);
    }

    @Transactional(readOnly = true)
    public List<CategoriaResponse> listarTodas(
            Long empresaId) {

        verificarEmpresa(empresaId);

        List<Categoria> categorias =
                categoriaRepository
                        .findAllByEmpresa_IdOrderByAtivoDescNomeAsc(
                                empresaId
                        );

        return converterParaListaDeResponse(categorias);
    }

    @Transactional(readOnly = true)
    public CategoriaResponse buscarPorId(
            Long empresaId,
            Long categoriaId) {

        Categoria categoria = buscarCategoria(
                empresaId,
                categoriaId
        );

        return CategoriaResponse.de(categoria);
    }

    @Transactional
    public CategoriaResponse atualizar(
            Long empresaId,
            Long categoriaId,
            AtualizarCategoriaRequest request) {

        Categoria categoria = buscarCategoria(
                empresaId,
                categoriaId
        );

        String novoNome =
                normalizarNome(request.nome());

        boolean nomeFoiAlterado =
                !categoria.getNome().equalsIgnoreCase(
                        novoNome
                );

        AreaCategoria novaArea =
                request.area() != null
                        ? request.area()
                        : categoria.getArea();

        boolean areaFoiAlterada =
                categoria.getArea() != novaArea;

        if (nomeFoiAlterado) {
            verificarCategoriaDuplicada(
                    empresaId,
                    novoNome,
                    categoria.getTipo()
            );

            categoria.alterarNome(novoNome);
        }

        if (areaFoiAlterada) {
            categoria.alterarArea(novaArea);
        }

        Categoria categoriaSalva =
                categoriaRepository.saveAndFlush(
                        categoria
                );

        return CategoriaResponse.de(categoriaSalva);
    }

    @Transactional
    public CategoriaResponse desativar(
            Long empresaId,
            Long categoriaId) {

        Categoria categoria = buscarCategoria(
                empresaId,
                categoriaId
        );

        categoria.desativar();

        Categoria categoriaSalva =
                categoriaRepository.saveAndFlush(
                        categoria
                );

        return CategoriaResponse.de(categoriaSalva);
    }

    @Transactional
    public CategoriaResponse ativar(
            Long empresaId,
            Long categoriaId) {

        Categoria categoria = buscarCategoria(
                empresaId,
                categoriaId
        );

        categoria.ativar();

        Categoria categoriaSalva =
                categoriaRepository.saveAndFlush(
                        categoria
                );

        return CategoriaResponse.de(categoriaSalva);
    }

    @Transactional(
            noRollbackFor =
                    CategoriaComMovimentacoesException.class
    )
    public void excluir(
            Long empresaId,
            Long categoriaId) {

        Categoria categoria = buscarCategoria(
                empresaId,
                categoriaId
        );

        boolean possuiMovimentacoes =
                movimentacaoRepository
                        .existsByEmpresa_IdAndCategoria_Id(
                                empresaId,
                                categoriaId
                        );

        boolean possuiContas =
                contaFinanceiraRepository
                        .existsByEmpresa_IdAndCategoria_Id(
                                empresaId,
                                categoriaId
                        );

        if (possuiMovimentacoes || possuiContas) {
            throw new CategoriaComMovimentacoesException(
                    categoria.getNome()
            );
        }

        categoriaRepository.delete(categoria);
        categoriaRepository.flush();
    }

    @Transactional
    public TransferenciaCategoriaResponse
    transferirMovimentacoesEExcluir(
            Long empresaId,
            Long categoriaOrigemId,
            TransferirMovimentacoesCategoriaRequest
                    request) {

        Categoria categoriaOrigem =
                buscarCategoria(
                        empresaId,
                        categoriaOrigemId
                );

        validarCategoriaOrigem(
                categoriaOrigem
        );

        Categoria categoriaDestino =
                buscarCategoria(
                        empresaId,
                        request.categoriaDestinoId()
                );

        validarCategoriaDestino(
                categoriaOrigem,
                categoriaDestino
        );

        int movimentacoesTransferidas =
                movimentacaoRepository
                        .transferirCategoria(
                                empresaId,
                                categoriaOrigemId,
                                categoriaDestino
                        );

        categoriaRepository.delete(
                categoriaOrigem
        );

        categoriaRepository.flush();

        return new TransferenciaCategoriaResponse(
                categoriaOrigemId,
                categoriaDestino.getId(),
                movimentacoesTransferidas,
                "Movimentações transferidas e "
                        + "categoria excluída com sucesso"
        );
    }

    private void validarCategoriaOrigem(
            Categoria categoriaOrigem) {

        if (categoriaOrigem.isAtivo()) {
            throw new TransferenciaCategoriaInvalidaException(
                    "Desative a categoria antes de "
                            + "transferir suas movimentações"
            );
        }

        if (categoriaOrigem.getArquivadaEm() == null) {
            throw new TransferenciaCategoriaInvalidaException(
                    "A categoria ainda não possui uma "
                            + "data de arquivamento válida"
            );
        }

        LocalDateTime dataLiberacao =
                calcularDataLiberacao(
                        categoriaOrigem
                );

        if (LocalDateTime.now().isBefore(dataLiberacao)) {
            throw new TransferenciaCategoriaInvalidaException(
                    "Por segurança, aguarde até "
                            + dataLiberacao.format(
                            FORMATADOR_DATA
                    )
                            + " para transferir as "
                            + "movimentações e excluir "
                            + "esta categoria"
            );
        }
    }

    private void validarCategoriaDestino(
            Categoria categoriaOrigem,
            Categoria categoriaDestino) {

        if (
                categoriaOrigem.getId().equals(
                        categoriaDestino.getId()
                )
        ) {
            throw new TransferenciaCategoriaInvalidaException(
                    "Escolha uma categoria de destino "
                            + "diferente da categoria atual"
            );
        }

        if (!categoriaDestino.isAtivo()) {
            throw new TransferenciaCategoriaInvalidaException(
                    "A categoria de destino precisa "
                            + "estar ativa"
            );
        }

        if (
                categoriaOrigem.getTipo() !=
                        categoriaDestino.getTipo()
        ) {
            throw new TransferenciaCategoriaInvalidaException(
                    "Escolha uma categoria de destino "
                            + "do mesmo tipo: "
                            + categoriaOrigem
                            .getTipo()
                            .getDescricao()
            );
        }
    }

    private LocalDateTime calcularDataLiberacao(
            Categoria categoria) {

        if (categoria.getArquivadaEm() == null) {
            return LocalDateTime.now().plusHours(36);
        }

        return categoria
                .getArquivadaEm()
                .plusHours(36);
    }

    private Categoria buscarCategoria(
            Long empresaId,
            Long categoriaId) {

        return categoriaRepository
                .findByIdAndEmpresa_Id(
                        categoriaId,
                        empresaId
                )
                .orElseThrow(
                        () -> new CategoriaNaoEncontradaException(
                                categoriaId
                        )
                );
    }

    private void verificarEmpresa(
            Long empresaId) {

        if (!empresaRepository.existsById(empresaId)) {
            throw new EmpresaNaoEncontradaException(
                    empresaId
            );
        }
    }

    private void verificarCategoriaDuplicada(
            Long empresaId,
            String nome,
            TipoMovimentacao tipo) {

        boolean categoriaJaExiste =
                categoriaRepository
                        .existsByEmpresa_IdAndNomeIgnoreCaseAndTipo(
                                empresaId,
                                nome,
                                tipo
                        );

        if (categoriaJaExiste) {
            throw new CategoriaJaCadastradaException(
                    nome,
                    tipo
            );
        }
    }

    private List<CategoriaResponse>
    converterParaListaDeResponse(
            List<Categoria> categorias) {

        return categorias.stream()
                .map(CategoriaResponse::de)
                .toList();
    }

    private String normalizarNome(
            String nome) {

        return nome
                .trim()
                .replaceAll("\\s+", " ");
    }

    private AreaCategoria normalizarArea(
            AreaCategoria area) {

        return area != null
                ? area
                : AreaCategoria.GERAL;
    }
}
