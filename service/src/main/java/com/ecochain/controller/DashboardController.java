package com.ecochain.controller;

import com.ecochain.dto.DashboardResponse;
import com.ecochain.security.RequiereRol;
import com.ecochain.service.DashboardService;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/dashboard")
@CrossOrigin(origins = "*")
@RequiereRol("ADMINISTRADOR")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @GetMapping
    public DashboardResponse obtener(@RequestParam(required = false) Integer anio) {
        return service.construir(anio == null ? LocalDate.now().getYear() : anio);
    }
}
