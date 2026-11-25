package com.ecochain.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record EnvioRequest(
        @NotNull(message = "La fecha es obligatoria")
        LocalDate fecha,

        @NotBlank(message = "Indica la recicladora")
        @Size(max = 160)
        String recicladora,

        @NotNull(message = "Indica el monto recuperado")
        @DecimalMin(value = "0.0", message = "El monto no puede ser negativo")
        BigDecimal montoRecuperado,

        @Size(max = 500)
        String notas,

        @NotEmpty(message = "Selecciona al menos un lote")
        List<Long> loteIds
) {
}
