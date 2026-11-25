package com.ecochain.controller;

import com.ecochain.dto.LoteRequest;
import com.ecochain.dto.LoteResponse;
import com.ecochain.security.RequiereRol;
import com.ecochain.service.LoteMermaService;
import jakarta.validation.Valid;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/lotes")
@CrossOrigin(origins = "*")
public class LoteMermaController {

    private final LoteMermaService service;

    public LoteMermaController(LoteMermaService service) {
        this.service = service;
    }

    @GetMapping
    public List<LoteResponse> listar(
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) Long idArea,
            @RequestParam(required = false) Long idMaterial,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate desde,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate hasta,
            @RequestParam(required = false) Integer anio) {
        return service.listar(estado, idArea, idMaterial, desde, hasta, anio);
    }

    @GetMapping("/disponibles")
    public List<LoteResponse> disponibles() {
        return service.disponibles();
    }

    @GetMapping("/anios")
    public List<Integer> anios() {
        return service.aniosConRegistros();
    }

    @GetMapping("/{id}")
    public LoteResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    @RequiereRol("OPERADOR")
    public ResponseEntity<LoteResponse> crear(@Valid @RequestBody LoteRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
    }

    @PutMapping("/{id}")
    @RequiereRol("OPERADOR")
    public LoteResponse actualizar(@PathVariable Long id,
                                   @Valid @RequestBody LoteRequest request) {
        return service.actualizar(id, request);
    }

    @DeleteMapping("/{id}")
    @RequiereRol("OPERADOR")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
