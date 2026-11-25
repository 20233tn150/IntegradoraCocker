package com.ecochain.repository;

import com.ecochain.model.LoteMerma;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface LoteMermaRepository extends JpaRepository<LoteMerma, Long> {

    @Query("""
            select l from LoteMerma l
            where (:estado is null or l.estado = :estado)
              and (:idArea is null or l.idArea = :idArea)
              and (:idMaterial is null or l.idMaterial = :idMaterial)
              and (:desde is null or l.fecha >= :desde)
              and (:hasta is null or l.fecha <= :hasta)
            order by l.fecha desc, l.id desc
            """)
    List<LoteMerma> buscar(@Param("estado") String estado,
                           @Param("idArea") Long idArea,
                           @Param("idMaterial") Long idMaterial,
                           @Param("desde") LocalDate desde,
                           @Param("hasta") LocalDate hasta);

    List<LoteMerma> findByEstadoAndIdEnvioIsNullOrderByFechaDesc(String estado);

    List<LoteMerma> findByIdEnvio(Long idEnvio);

    boolean existsByIdMaterial(Long idMaterial);

    boolean existsByIdArea(Long idArea);

    @Query("select coalesce(sum(l.kilos), 0) from LoteMerma l where l.idEnvio = :idEnvio")
    BigDecimal sumKilosByEnvio(@Param("idEnvio") Long idEnvio);

    /** Años con al menos un lote registrado, del más reciente al más antiguo. */
    @Query("""
            select distinct year(l.fecha)
            from LoteMerma l
            where l.fecha is not null
            order by year(l.fecha) desc
            """)
    List<Integer> aniosConRegistros();
}
