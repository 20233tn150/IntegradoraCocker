package com.ecochain.security;

import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

/**
 * Restringe un endpoint (o todo un controlador) a uno o varios roles.
 * Los roles válidos hoy son ADMINISTRADOR y OPERADOR.
 */
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiereRol {
    String[] value();
}
