package com.ecochain.dto;

import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
        int anio,
        List<Integer> aniosDisponibles,
        BigDecimal kilosTotales,
        BigDecimal perdidaBruta,
        BigDecimal montoRecuperado,
        BigDecimal perdidaNeta,
        long lotesTotales,
        long enviosTotales,
        BigDecimal kilosEnAlmacen,
        long lotesEnAlmacen,
        List<SerieMes> serieMensual,
        List<TopItem> topAreas,
        List<TopItem> topMateriales,
        List<TopMotivo> topMotivos
) {

    public record SerieMes(
            int mes,
            String etiqueta,
            BigDecimal kilosActual,
            BigDecimal kilosAnterior,
            BigDecimal perdidaActual
    ) {
    }

    public record TopItem(
            Long id,
            String nombre,
            BigDecimal kilos,
            double porcentaje,
            BigDecimal perdida
    ) {
    }

    public record TopMotivo(
            String motivo,
            BigDecimal kilos,
            double porcentaje
    ) {
    }
}
