package br.com.fluxocaixa.empresa;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface EmpresaRepository
        extends JpaRepository<Empresa, Long> {

    boolean existsByDocumento(String documento);

    Optional<Empresa> findByDocumento(String documento);
}