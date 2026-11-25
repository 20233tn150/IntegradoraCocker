package com.ecochain.repository;

import com.ecochain.model.EnvioReciclaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EnvioReciclajeRepository extends JpaRepository<EnvioReciclaje, Long> {
}
