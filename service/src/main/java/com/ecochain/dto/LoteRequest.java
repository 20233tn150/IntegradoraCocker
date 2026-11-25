package com.ecochain.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public record LoteRequest(
        @NotNull(message = "Los kilos son obligatorios")
        @DecimalMin(value = "0.01", message = "Los kilos deben ser mayores a 0")
        BigDecimal kilos,

        @NotNull(message = "La fecha es obligatoria")
        LocalDate fecha,

        @NotNull(message = "Selecciona un material")
        Long idMaterial,

        @NotNull(message = "Selecciona un área o máquina")
        Long idArea,

        @NotBlank(message = "Selecciona un motivo")
        @Size(max = 60)
        String motivo,

        @Size(max = 500, message = "Las observaciones no pueden exceder 500 caracteres")
        String observaciones
) {
}
