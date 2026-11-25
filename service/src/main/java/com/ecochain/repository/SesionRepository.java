package com.ecochain.repository;

import com.ecochain.model.Sesion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface SesionRepository extends JpaRepository<Sesion, Long> {

    Optional<Sesion> findByToken(String token);

    void deleteByToken(String token);

    void deleteByExpiraEnBefore(LocalDateTime momento);
}
