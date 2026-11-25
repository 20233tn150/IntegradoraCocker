package com.ecochain.controller;

import com.ecochain.model.AreaMaquina;
import com.ecochain.security.RequiereRol;
import com.ecochain.service.CatalogoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/areas")
@CrossOrigin(origins = "*")
public class AreaMaquinaController {

    private final CatalogoService service;

    public AreaMaquinaController(CatalogoService service) {
        this.service = service;
    }

    @GetMapping
    public List<AreaMaquina> listar() {
        return service.listarAreas();
    }

    @PostMapping
    @RequiereRol("ADMINISTRADOR")
    public ResponseEntity<AreaMaquina> crear(@Valid @RequestBody AreaMaquina area) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearArea(area));
    }

    @PutMapping("/{id}")
    @RequiereRol("ADMINISTRADOR")
    public AreaMaquina actualizar(@PathVariable Long id, @Valid @RequestBody AreaMaquina area) {
        return service.actualizarArea(id, area);
    }

    @DeleteMapping("/{id}")
    @RequiereRol("ADMINISTRADOR")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminarArea(id);
        return ResponseEntity.noContent().build();
    }
}
