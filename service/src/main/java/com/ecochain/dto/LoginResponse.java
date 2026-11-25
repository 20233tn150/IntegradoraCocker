package com.ecochain.dto;

public record LoginResponse(
        String token,
        UsuarioResponse usuario
) {
}
