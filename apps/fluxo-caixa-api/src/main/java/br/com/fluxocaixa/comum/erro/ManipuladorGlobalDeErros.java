package br.com.fluxocaixa.comum.erro;

import br.com.fluxocaixa.admin.AcessoAdministrativoNegadoException;
import br.com.fluxocaixa.admin.AcessoUsuarioBloqueadoException;
import br.com.fluxocaixa.admin.RegraAdministrativaException;
import br.com.fluxocaixa.autenticacao.CredenciaisInvalidasException;
import br.com.fluxocaixa.categoria.CategoriaComMovimentacoesException;
import br.com.fluxocaixa.categoria.CategoriaJaCadastradaException;
import br.com.fluxocaixa.categoria.CategoriaNaoEncontradaException;
import br.com.fluxocaixa.categoria.TransferenciaCategoriaInvalidaException;
import br.com.fluxocaixa.empresa.DocumentoJaCadastradoException;
import br.com.fluxocaixa.empresa.EmpresaNaoEncontradaException;
import br.com.fluxocaixa.fornecedor.FornecedorComComprasException;
import br.com.fluxocaixa.integration.asaas.AsaasException;
import br.com.fluxocaixa.movimentacao.MovimentacaoNaoEncontradaException;
import br.com.fluxocaixa.movimentacao.PeriodoInvalidoException;
import br.com.fluxocaixa.movimentacao.TipoMovimentacaoIncompativelException;
import br.com.fluxocaixa.recuperacaosenha.TokenRecuperacaoSenhaInvalidoException;
import br.com.fluxocaixa.usuario.EmailJaCadastradoException;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class ManipuladorGlobalDeErros {

    private static final Logger log =
            LoggerFactory.getLogger(
                    ManipuladorGlobalDeErros.class
            );

    @ExceptionHandler(DocumentoJaCadastradoException.class)
    public ResponseEntity<ErroResposta>
    tratarDocumentoDuplicado(
            DocumentoJaCadastradoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "Documento já cadastrado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(EmailJaCadastradoException.class)
    public ResponseEntity<ErroResposta>
    tratarEmailDuplicado(
            EmailJaCadastradoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "E-mail já cadastrado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of(
                        "email",
                        "Este e-mail já está sendo utilizado"
                )
        );
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ErroResposta>
    tratarCredenciaisInvalidas(
            CredenciaisInvalidasException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.UNAUTHORIZED,
                "Acesso não autorizado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(AcessoUsuarioBloqueadoException.class)
    public ResponseEntity<ErroResposta>
    tratarAcessoUsuarioBloqueado(
            AcessoUsuarioBloqueadoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.FORBIDDEN,
                "Acesso bloqueado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(AcessoAdministrativoNegadoException.class)
    public ResponseEntity<ErroResposta>
    tratarAcessoAdministrativoNegado(
            AcessoAdministrativoNegadoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.FORBIDDEN,
                "Acesso administrativo negado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(RegraAdministrativaException.class)
    public ResponseEntity<ErroResposta>
    tratarRegraAdministrativa(
            RegraAdministrativaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "OperaÃ§Ã£o administrativa nÃ£o permitida",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(CategoriaJaCadastradaException.class)
    public ResponseEntity<ErroResposta>
    tratarCategoriaDuplicada(
            CategoriaJaCadastradaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "Categoria já cadastrada",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(
            CategoriaComMovimentacoesException.class
    )
    public ResponseEntity<ErroResposta>
    tratarCategoriaComMovimentacoes(
            CategoriaComMovimentacoesException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "Categoria possui movimentações",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(FornecedorComComprasException.class)
    public ResponseEntity<ErroResposta>
    tratarFornecedorComCompras(
            FornecedorComComprasException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "Fornecedor possui compras",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(
            TransferenciaCategoriaInvalidaException.class
    )
    public ResponseEntity<ErroResposta>
    tratarTransferenciaCategoriaInvalida(
            TransferenciaCategoriaInvalidaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.CONFLICT,
                "Transferência não permitida",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(EmpresaNaoEncontradaException.class)
    public ResponseEntity<ErroResposta>
    tratarEmpresaNaoEncontrada(
            EmpresaNaoEncontradaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.NOT_FOUND,
                "Empresa não encontrada",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErroResposta>
    tratarEntidadeNaoEncontrada(
            EntityNotFoundException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.NOT_FOUND,
                "Registro nao encontrado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(CategoriaNaoEncontradaException.class)
    public ResponseEntity<ErroResposta>
    tratarCategoriaNaoEncontrada(
            CategoriaNaoEncontradaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.NOT_FOUND,
                "Categoria não encontrada",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MovimentacaoNaoEncontradaException.class)
    public ResponseEntity<ErroResposta>
    tratarMovimentacaoNaoEncontrada(
            MovimentacaoNaoEncontradaException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.NOT_FOUND,
                "Movimentação não encontrada",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(
            TipoMovimentacaoIncompativelException.class
    )
    public ResponseEntity<ErroResposta>
    tratarTipoIncompativel(
            TipoMovimentacaoIncompativelException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Categoria incompatível",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(PeriodoInvalidoException.class)
    public ResponseEntity<ErroResposta>
    tratarPeriodoInvalido(
            PeriodoInvalidoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Período inválido",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(
            TokenRecuperacaoSenhaInvalidoException.class
    )
    public ResponseEntity<ErroResposta>
    tratarTokenRecuperacaoSenhaInvalido(
            TokenRecuperacaoSenhaInvalidoException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Link de recuperação inválido",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErroResposta>
    tratarValidacao(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {

        Map<String, String> campos =
                new LinkedHashMap<>();

        exception.getBindingResult()
                .getFieldErrors()
                .forEach(erro -> campos.putIfAbsent(
                        erro.getField(),
                        erro.getDefaultMessage()
                ));

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Dados inválidos",
                "Verifique os dados informados",
                request.getRequestURI(),
                campos
        );
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErroResposta>
    tratarJsonInvalido(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Dados inválidos",
                "Não foi possível entender os dados enviados",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(
            MethodArgumentTypeMismatchException.class
    )
    public ResponseEntity<ErroResposta>
    tratarParametroInvalido(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request) {

        String mensagem;

        if ("tipo".equals(exception.getName())) {
            mensagem =
                    "Escolha RECEITA para dinheiro que entrou "
                            + "ou DESPESA para dinheiro que saiu";
        } else {
            mensagem =
                    "O parâmetro '"
                            + exception.getName()
                            + "' possui um valor inválido";
        }

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Parâmetro inválido",
                mensagem,
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErroResposta>
    tratarArgumentoInvalido(
            IllegalArgumentException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Dados invÃ¡lidos",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(AsaasException.class)
    public ResponseEntity<ErroResposta>
    tratarErroAsaas(
            AsaasException exception,
            HttpServletRequest request) {

        log.warn(
                "Falha de integracao Asaas em {}: {}",
                request.getRequestURI(),
                exception.getMessage()
        );

        return criarResposta(
                HttpStatus.BAD_GATEWAY,
                "Pagamento indisponivel",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErroResposta>
    tratarAcessoNegado(
            AccessDeniedException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.FORBIDDEN,
                "Acesso negado",
                exception.getMessage(),
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErroResposta>
    tratarRecursoNaoEncontrado(
            NoResourceFoundException exception,
            HttpServletRequest request) {

        return criarResposta(
                HttpStatus.NOT_FOUND,
                "Recurso nao encontrado",
                "Este recurso ainda nao esta disponivel no servidor publicado.",
                request.getRequestURI(),
                Map.of()
        );
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErroResposta>
    tratarErroInesperado(
            Exception exception,
            HttpServletRequest request) {

        log.error(
                "Erro inesperado ao processar {}",
                request.getRequestURI(),
                exception
        );

        return criarResposta(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Erro interno",
                "Ocorreu um erro inesperado. Tente novamente",
                request.getRequestURI(),
                Map.of()
        );
    }

    private ResponseEntity<ErroResposta> criarResposta(
            HttpStatus status,
            String erro,
            String mensagem,
            String caminho,
            Map<String, String> campos) {

        ErroResposta resposta = new ErroResposta(
                LocalDateTime.now(),
                status.value(),
                erro,
                mensagem,
                caminho,
                campos
        );

        return ResponseEntity
                .status(status)
                .body(resposta);
    }
}
