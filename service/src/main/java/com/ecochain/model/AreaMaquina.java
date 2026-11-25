package com.ecochain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "areas_maquina")
public class AreaMaquina {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String nombre;

    /** AREA | MAQUINA */
    @Size(max = 20)
    private String tipo;

    @Size(max = 120)
    private String ubicacion;

    @Size(max = 120)
    private String responsable;

    /** Las áreas inactivas no se pueden usar en lotes nuevos. */
    private Boolean activo;

    public AreaMaquina() {
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

    public String getTipo() {
        return tipo;
    }

    public void setTipo(String tipo) {
        this.tipo = tipo;
    }

    public String getUbicacion() {
        return ubicacion;
    }

    public void setUbicacion(String ubicacion) {
        this.ubicacion = ubicacion;
    }

    public String getResponsable() {
        return responsable;
    }

    public void setResponsable(String responsable) {
        this.responsable = responsable;
    }

    public Boolean getActivo() {
        return activo == null ? Boolean.TRUE : activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
