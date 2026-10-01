package br.com.fluxocaixa.fornecedor;

import br.com.fluxocaixa.integracaooficial.CnpjOfficialDataResponse;
import br.com.fluxocaixa.integracaooficial.OfficialCnpjService;
import org.springframework.stereotype.Service;

@Service
public class ReceitaFederalCnpjService {

    private final OfficialCnpjService officialCnpjService;

    public ReceitaFederalCnpjService(
            OfficialCnpjService officialCnpjService) {
        this.officialCnpjService = officialCnpjService;
    }

    public ConsultaCnpjFornecedorResponse consultar(String cnpj) {
        CnpjOfficialDataResponse dados =
                officialCnpjService.consultar(cnpj);

        return new ConsultaCnpjFornecedorResponse(
                dados.cnpj(),
                dados.nomeFantasia(),
                dados.razaoSocial(),
                null,
                null,
                dados.porte(),
                dados.cep(),
                dados.logradouro(),
                dados.numero(),
                dados.complemento(),
                dados.bairro(),
                dados.municipio(),
                dados.uf(),
                "Brasil"
        );
    }
}
