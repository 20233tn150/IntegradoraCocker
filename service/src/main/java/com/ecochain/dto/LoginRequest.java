package com.ecochain.dto;

import jakarta.validation.constraints.NotBlank;

public record LoginRequest(
        @NotBlank(message = "Escribe tu correo") String email,
        @NotBlank(message = "Escribe tu contraseña") String password
) {
}
