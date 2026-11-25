package com.ecochain.service;

import com.ecochain.exception.ApiException;
import com.ecochain.model.AreaMaquina;
import com.ecochain.model.Material;
import com.ecochain.repository.AreaMaquinaRepository;
import com.ecochain.repository.LoteMermaRepository;
import com.ecochain.repository.MaterialRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class CatalogoService {

    private final MaterialRepository materialRepository;
    private final AreaMaquinaRepository areaRepository;
    private final LoteMermaRepository loteRepository;

    public CatalogoService(MaterialRepository materialRepository,
                           AreaMaquinaRepository areaRepository,
                           LoteMermaRepository loteRepository) {
        this.materialRepository = materialRepository;
        this.areaRepository = areaRepository;
        this.loteRepository = loteRepository;
    }

    @Transactional(readOnly = true)
    public List<Material> listarMateriales() {
        return materialRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre"));
    }

    @Transactional
    public Material crearMaterial(Material material) {
        String nombre = validarNombre(material.getNombre());
        if (materialRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ya existe un material con el nombre " + nombre);
        }
        material.setId(null);
        material.setNombre(nombre);
        material.setCostoPorKg(material.getCostoPorKg() == null
                ? BigDecimal.ZERO : material.getCostoPorKg());
        material.setActivo(material.getActivo() == null ? Boolean.TRUE : material.getActivo());
        return materialRepository.save(material);
    }

    @Transactional
    public Material actualizarMaterial(Long id, Material datos) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el material con id " + id));

        String nombre = validarNombre(datos.getNombre());
        materialRepository.findByNombreIgnoreCase(nombre)
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Ya existe un material con el nombre " + nombre);
                });

        material.setNombre(nombre);
        material.setCategoria(datos.getCategoria());
        material.setCostoPorKg(datos.getCostoPorKg() == null
                ? BigDecimal.ZERO : datos.getCostoPorKg());
        material.setActivo(datos.getActivo() == null ? Boolean.TRUE : datos.getActivo());
        return materialRepository.save(material);
    }

    @Transactional
    public void eliminarMaterial(Long id) {
        Material material = materialRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el material con id " + id));
        if (loteRepository.existsByIdMaterial(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "No se puede eliminar: hay lotes asociados. Puedes marcarlo como inactivo.");
        }
        materialRepository.delete(material);
    }

    @Transactional(readOnly = true)
    public List<AreaMaquina> listarAreas() {
        return areaRepository.findAll(Sort.by(Sort.Direction.ASC, "nombre"));
    }

    @Transactional
    public AreaMaquina crearArea(AreaMaquina area) {
        String nombre = validarNombre(area.getNombre());
        if (areaRepository.existsByNombreIgnoreCase(nombre)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "Ya existe un área o máquina con el nombre " + nombre);
        }
        area.setId(null);
        area.setNombre(nombre);
        area.setTipo(area.getTipo() == null || area.getTipo().isBlank()
                ? "AREA" : area.getTipo().trim().toUpperCase());
        area.setActivo(area.getActivo() == null ? Boolean.TRUE : area.getActivo());
        return areaRepository.save(area);
    }

    @Transactional
    public AreaMaquina actualizarArea(Long id, AreaMaquina datos) {
        AreaMaquina area = areaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el área o máquina con id " + id));

        String nombre = validarNombre(datos.getNombre());
        areaRepository.findByNombreIgnoreCase(nombre)
                .filter(otro -> !otro.getId().equals(id))
                .ifPresent(otro -> {
                    throw new ApiException(HttpStatus.CONFLICT,
                            "Ya existe un área o máquina con el nombre " + nombre);
                });

        area.setNombre(nombre);
        area.setTipo(datos.getTipo() == null || datos.getTipo().isBlank()
                ? "AREA" : datos.getTipo().trim().toUpperCase());
        area.setUbicacion(datos.getUbicacion());
        area.setResponsable(datos.getResponsable());
        area.setActivo(datos.getActivo() == null ? Boolean.TRUE : datos.getActivo());
        return areaRepository.save(area);
    }

    @Transactional
    public void eliminarArea(Long id) {
        AreaMaquina area = areaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el área o máquina con id " + id));
        if (loteRepository.existsByIdArea(id)) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "No se puede eliminar: hay lotes asociados. Puedes marcarla como inactiva.");
        }
        areaRepository.delete(area);
    }

    private static String validarNombre(String nombre) {
        if (nombre == null || nombre.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "El nombre es obligatorio");
        }
        return nombre.trim();
    }
}
