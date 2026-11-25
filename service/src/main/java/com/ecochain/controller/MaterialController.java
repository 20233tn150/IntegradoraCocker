package com.ecochain.controller;

import com.ecochain.model.Material;
import com.ecochain.security.RequiereRol;
import com.ecochain.service.CatalogoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/materiales")
@CrossOrigin(origins = "*")
public class MaterialController {

    private final CatalogoService service;

    public MaterialController(CatalogoService service) {
        this.service = service;
    }

    @GetMapping
    public List<Material> listar() {
        return service.listarMateriales();
    }

    @PostMapping
    @RequiereRol("ADMINISTRADOR")
    public ResponseEntity<Material> crear(@Valid @RequestBody Material material) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crearMaterial(material));
    }

    @PutMapping("/{id}")
    @RequiereRol("ADMINISTRADOR")
    public Material actualizar(@PathVariable Long id, @Valid @RequestBody Material material) {
        return service.actualizarMaterial(id, material);
    }

    @DeleteMapping("/{id}")
    @RequiereRol("ADMINISTRADOR")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminarMaterial(id);
        return ResponseEntity.noContent().build();
    }
}
