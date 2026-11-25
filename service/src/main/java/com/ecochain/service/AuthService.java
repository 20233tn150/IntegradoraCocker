package com.ecochain.service;

import com.ecochain.dto.LoginRequest;
import com.ecochain.dto.LoginResponse;
import com.ecochain.dto.UsuarioResponse;
import com.ecochain.exception.ApiException;
import com.ecochain.model.Sesion;
import com.ecochain.model.Usuario;
import com.ecochain.repository.SesionRepository;
import com.ecochain.repository.UsuarioRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    /** Duración de la sesión: 12 horas. */
    private static final long HORAS_SESION = 12;

    private final UsuarioRepository usuarioRepository;
    private final SesionRepository sesionRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UsuarioRepository usuarioRepository,
                       SesionRepository sesionRepository,
                       PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.sesionRepository = sesionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public LoginResponse login(LoginRequest request) {
        String email = request.email() == null ? "" : request.email().trim();
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(email)
                .orElseThrow(AuthService::credencialesInvalidas);

        if (!usuario.isActivo()
                || usuario.getPasswordHash() == null
                || !passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            throw credencialesInvalidas();
        }

        sesionRepository.deleteByExpiraEnBefore(LocalDateTime.now());

        Sesion sesion = new Sesion();
        sesion.setToken(nuevoToken());
        sesion.setIdUsuario(usuario.getId());
        sesion.setCreadaEn(LocalDateTime.now());
        sesion.setExpiraEn(LocalDateTime.now().plusHours(HORAS_SESION));
        sesionRepository.save(sesion);

        return new LoginResponse(sesion.getToken(), UsuarioResponse.de(usuario));
    }

    @Transactional(readOnly = true)
    public Optional<Usuario> usuarioPorToken(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return sesionRepository.findByToken(token)
                .filter(sesion -> sesion.getExpiraEn() != null
                        && sesion.getExpiraEn().isAfter(LocalDateTime.now()))
                .flatMap(sesion -> usuarioRepository.findById(sesion.getIdUsuario()))
                .filter(Usuario::isActivo);
    }

    @Transactional
    public void logout(String token) {
        if (token != null && !token.isBlank()) {
            sesionRepository.deleteByToken(token);
        }
    }

    public static boolean tieneRol(Usuario usuario, String... roles) {
        if (usuario == null || usuario.getRol() == null) {
            return false;
        }
        for (String rol : roles) {
            if (rol.equalsIgnoreCase(usuario.getRol())) {
                return true;
            }
        }
        return false;
    }

    private static String nuevoToken() {
        return UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");
    }

    private static ApiException credencialesInvalidas() {
        return new ApiException(HttpStatus.UNAUTHORIZED, "Correo o contraseña incorrectos");
    }
}
