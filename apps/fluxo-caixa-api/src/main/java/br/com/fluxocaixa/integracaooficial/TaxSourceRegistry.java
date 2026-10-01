package br.com.fluxocaixa.integracaooficial;

import org.springframework.stereotype.Service;

@Service
public class TaxSourceRegistry {

    private final TaxSourceRepository taxSourceRepository;

    public TaxSourceRegistry(TaxSourceRepository taxSourceRepository) {
        this.taxSourceRepository = taxSourceRepository;
    }

    public long totalFontesRegistradas() {
        return taxSourceRepository.count();
    }
}
