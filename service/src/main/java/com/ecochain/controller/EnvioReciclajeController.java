package com.ecochain.controller;

import com.ecochain.dto.EnvioRequest;
import com.ecochain.dto.EnvioResponse;
import com.ecochain.security.RequiereRol;
import com.ecochain.service.EnvioService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/envios")
@CrossOrigin(origins = "*")
@RequiereRol("ADMINISTRADOR")
public class EnvioReciclajeController {

    private final EnvioService service;

    public EnvioReciclajeController(EnvioService service) {
        this.service = service;
    }

    @GetMapping
    public List<EnvioResponse> listar() {
        return service.listar();
    }

    @GetMapping("/{id}")
    public EnvioResponse obtener(@PathVariable Long id) {
        return service.obtener(id);
    }

    @PostMapping
    public ResponseEntity<EnvioResponse> crear(@Valid @RequestBody EnvioRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.crear(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminar(id);
        return ResponseEntity.noContent().build();
    }
}
