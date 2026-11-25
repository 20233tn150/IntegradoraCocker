package com.ecochain.repository;

import com.ecochain.model.AreaMaquina;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AreaMaquinaRepository extends JpaRepository<AreaMaquina, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    Optional<AreaMaquina> findByNombreIgnoreCase(String nombre);
}
