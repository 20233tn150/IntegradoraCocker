package com.ecochain.controller;

import com.ecochain.dto.LoginRequest;
import com.ecochain.dto.LoginResponse;
import com.ecochain.dto.UsuarioResponse;
import com.ecochain.model.Usuario;
import com.ecochain.security.AuthInterceptor;
import com.ecochain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request);
    }

    @GetMapping("/me")
    public UsuarioResponse me(HttpServletRequest request) {
        return UsuarioResponse.de(usuario(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        authService.logout((String) request.getAttribute(AuthInterceptor.ATRIBUTO_TOKEN));
        return ResponseEntity.noContent().build();
    }

    private static Usuario usuario(HttpServletRequest request) {
        return (Usuario) request.getAttribute(AuthInterceptor.ATRIBUTO_USUARIO);
    }
}
