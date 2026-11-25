package com.ecochain.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "envios_reciclaje")
public class EnvioReciclaje {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull
    private LocalDate fecha;

    @NotBlank
    @Size(max = 160)
    private String recicladora;

    @NotNull
    @DecimalMin("0.0")
    @Column(name = "monto_recuperado", nullable = false, precision = 12, scale = 2)
    private BigDecimal montoRecuperado;

    @Size(max = 500)
    private String notas;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    public EnvioReciclaje() {
    }

    @PrePersist
    void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public LocalDate getFecha() {
        return fecha;
    }

    public void setFecha(LocalDate fecha) {
        this.fecha = fecha;
    }

    public String getRecicladora() {
        return recicladora;
    }

    public void setRecicladora(String recicladora) {
        this.recicladora = recicladora;
    }

    public BigDecimal getMontoRecuperado() {
        return montoRecuperado;
    }

    public void setMontoRecuperado(BigDecimal montoRecuperado) {
        this.montoRecuperado = montoRecuperado;
    }

    public String getNotas() {
        return notas;
    }

    public void setNotas(String notas) {
        this.notas = notas;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
