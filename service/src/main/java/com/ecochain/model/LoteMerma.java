package com.ecochain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "lotes_merma")
public class LoteMerma {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Kilos del lote de merma. */
    @NotNull
    @DecimalMin("0.01")
    private BigDecimal kilos;

    /** Fecha en la que se generó el lote. */
    @NotNull
    private LocalDate fecha;

    /** EN_ALMACEN | ENVIADO */
    private String estado = "EN_ALMACEN";

    /** FK al material asociado al lote. */
    @Column(name = "id_material")
    private Long idMaterial;

    /** FK al área o máquina donde se generó la merma. */
    @Column(name = "id_area")
    private Long idArea;

    /** FALLA_CALIBRACION, CORTE_DEFECTUOSO, MATERIAL_CADUCADO, ERROR_OPERACION, CONTAMINACION, OTRO */
    private String motivo;

    /** FK al envío a reciclaje (null mientras siga en almacén). */
    @Column(name = "id_envio")
    private Long idEnvio;

    @Column(length = 500)
    private String observaciones;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public LoteMerma() {
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (estado == null || estado.isBlank()) {
            estado = "EN_ALMACEN";
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getKilos() {
        return kilos;
    }

    public void setKilos(BigDecimal kilos) {
        this.kilos = kilos;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public Long getIdMaterial() {
        return idMaterial;
    }

    public void setIdMaterial(Long idMaterial) {
        this.idMaterial = idMaterial;
    }

    public Long getIdArea() {
        return idArea;
    }

    public void setIdArea(Long idArea) {
        this.idArea = idArea;
    }

    public String getMotivo() {
        return motivo;
    }

    public void setMotivo(String motivo) {
        this.motivo = motivo;
    }

    public Long getIdEnvio() {
        return idEnvio;
    }

    public void setIdEnvio(Long idEnvio) {
        this.idEnvio = idEnvio;
    }

    public String getObservaciones() {
        return observaciones;
    }

    public void setObservaciones(String observaciones) {
        this.observaciones = observaciones;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
