package com.ecochain.dto;

import com.ecochain.model.Usuario;

public record UsuarioResponse(
        Long id,
        String nombre,
        String email,
        String rol
) {

    public static UsuarioResponse de(Usuario usuario) {
        return new UsuarioResponse(
                usuario.getId(),
                usuario.getNombre(),
                usuario.getEmail(),
                usuario.getRol()
        );
    }
}
