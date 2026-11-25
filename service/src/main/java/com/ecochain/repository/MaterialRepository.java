package com.ecochain.repository;

import com.ecochain.model.Material;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MaterialRepository extends JpaRepository<Material, Long> {

    boolean existsByNombreIgnoreCase(String nombre);

    Optional<Material> findByNombreIgnoreCase(String nombre);
}
