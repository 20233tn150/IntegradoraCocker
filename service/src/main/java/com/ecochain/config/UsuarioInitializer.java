package com.ecochain.config;

import com.ecochain.model.Usuario;
import com.ecochain.repository.UsuarioRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Crea las cuentas base de la demo si todavía no existen.
 * No depende de ecochain.seed-demo: sin usuarios no se puede entrar al sistema.
 */
@Component
public class UsuarioInitializer implements CommandLineRunner {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioInitializer(UsuarioRepository usuarioRepository,
                              PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        asegurar("Administrador", "admin@ecochain.mx", "admin123", "ADMINISTRADOR");
        asegurar("Operador de planta", "operador@ecochain.mx", "operador123", "OPERADOR");
    }

    private void asegurar(String nombre, String email, String password, String rol) {
        usuarioRepository.findByEmailIgnoreCase(email).ifPresentOrElse(usuario -> {
            boolean cambios = false;
            if (usuario.getPasswordHash() == null || usuario.getPasswordHash().isBlank()) {
                usuario.setPasswordHash(passwordEncoder.encode(password));
                cambios = true;
            }
            if (usuario.getRol() == null || usuario.getRol().isBlank()) {
                usuario.setRol(rol);
                cambios = true;
            }
            if (usuario.getActivo() == null) {
                usuario.setActivo(true);
                cambios = true;
            }
            if (cambios) {
                usuarioRepository.save(usuario);
            }
        }, () -> {
            Usuario usuario = new Usuario();
            usuario.setNombre(nombre);
            usuario.setEmail(email);
            usuario.setRol(rol);
            usuario.setPasswordHash(passwordEncoder.encode(password));
            usuario.setActivo(true);
            usuarioRepository.save(usuario);
        });
    }
}
