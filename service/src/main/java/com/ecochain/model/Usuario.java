package com.ecochain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

@Entity
@Table(name = "usuarios")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    private String nombre;

    /** Correo con el que se inicia sesión. */
    @NotBlank
    private String email;

    /** ADMINISTRADOR | OPERADOR */
    private String rol;

    /** Hash BCrypt de la contraseña. */
    @Column(name = "password_hash", length = 100)
    private String passwordHash;

    @Column(nullable = false)
    private Boolean activo = true;

    public Usuario() {
    }

    public boolean isActivo() {
        return activo == null || activo;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Boolean getActivo() {
        return activo == null ? Boolean.TRUE : activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
