package com.ecochain.security;

import com.ecochain.model.Usuario;
import com.ecochain.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.HandlerInterceptor;

import java.io.IOException;
import java.util.Optional;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    /** Nombre del atributo donde se guarda el usuario autenticado en la petición. */
    public static final String ATRIBUTO_USUARIO = "usuarioActual";
    public static final String ATRIBUTO_TOKEN = "tokenActual";

    private final AuthService authService;

    public AuthInterceptor(AuthService authService) {
        this.authService = authService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request,
                             HttpServletResponse response,
                             Object handler) throws IOException {
        // Los preflight de CORS no llevan token.
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String token = extraerToken(request);
        Optional<Usuario> usuario = authService.usuarioPorToken(token);
        if (usuario.isEmpty()) {
            responderError(response, HttpStatus.UNAUTHORIZED,
                    "Tu sesión no es válida o expiró. Inicia sesión de nuevo.");
            return false;
        }

        request.setAttribute(ATRIBUTO_USUARIO, usuario.get());
        request.setAttribute(ATRIBUTO_TOKEN, token);

        if (handler instanceof HandlerMethod metodo) {
            RequiereRol requiere = AnnotatedElementUtils
                    .findMergedAnnotation(metodo.getMethod(), RequiereRol.class);
            if (requiere == null) {
                requiere = AnnotatedElementUtils
                        .findMergedAnnotation(metodo.getBeanType(), RequiereRol.class);
            }
            if (requiere != null && !AuthService.tieneRol(usuario.get(), requiere.value())) {
                responderError(response, HttpStatus.FORBIDDEN,
                        "Tu rol no tiene permiso para realizar esta acción.");
                return false;
            }
        }
        return true;
    }

    private static String extraerToken(HttpServletRequest request) {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            return null;
        }
        return header.substring(7).trim();
    }

    private static void responderError(HttpServletResponse response,
                                       HttpStatus status,
                                       String mensaje) throws IOException {
        response.setStatus(status.value());
        response.setCharacterEncoding("UTF-8");
        response.setContentType("application/json;charset=UTF-8");
        response.getWriter().write("{\"status\":" + status.value()
                + ",\"error\":\"" + status.getReasonPhrase()
                + "\",\"message\":\"" + mensaje + "\"}");
    }
}
