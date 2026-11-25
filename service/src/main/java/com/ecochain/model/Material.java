package com.ecochain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

@Entity
@Table(name = "materiales")
public class Material {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Size(max = 100)
    private String nombre;

    @Size(max = 80)
    private String categoria;

    /** Costo por kilogramo del material (para valorizar la merma). */
    @NotNull
    @DecimalMin("0.0")
    @Column(name = "costo_por_kg", nullable = false, precision = 12, scale = 2)
    private BigDecimal costoPorKg;

    /** Los materiales inactivos no se pueden usar en lotes nuevos. */
    private Boolean activo;

    public Material() {
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

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public BigDecimal getCostoPorKg() {
        return costoPorKg;
    }

    public void setCostoPorKg(BigDecimal costoPorKg) {
        this.costoPorKg = costoPorKg;
    }

    public Boolean getActivo() {
        return activo == null ? Boolean.TRUE : activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }
}
