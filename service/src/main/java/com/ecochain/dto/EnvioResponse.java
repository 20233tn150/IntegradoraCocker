package com.ecochain.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EnvioResponse(
        Long id,
        LocalDate fecha,
        String recicladora,
        BigDecimal montoRecuperado,
        String notas,
        BigDecimal kilosTotales,
        BigDecimal costoTotal,
        long lotesCount,
        List<LoteResponse> lotes
) {
}
