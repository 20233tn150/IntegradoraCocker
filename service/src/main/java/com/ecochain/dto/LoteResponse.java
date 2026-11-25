package com.ecochain.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public record LoteResponse(
        Long id,
        BigDecimal kilos,
        LocalDate fecha,
        String estado,
        String motivo,
        String observaciones,
        Long idMaterial,
        String materialNombre,
        String materialCategoria,
        BigDecimal costoPorKg,
        Long idArea,
        String areaNombre,
        Long idEnvio,
        BigDecimal costoEstimado,
        LocalDateTime createdAt
) {
}
