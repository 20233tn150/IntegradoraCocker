package com.ecochain.service;

import com.ecochain.dto.LoteRequest;
import com.ecochain.dto.LoteResponse;
import com.ecochain.exception.ApiException;
import com.ecochain.model.AreaMaquina;
import com.ecochain.model.LoteMerma;
import com.ecochain.model.Material;
import com.ecochain.repository.AreaMaquinaRepository;
import com.ecochain.repository.LoteMermaRepository;
import com.ecochain.repository.MaterialRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class LoteMermaService {

    private final LoteMermaRepository loteRepository;
    private final MaterialRepository materialRepository;
    private final AreaMaquinaRepository areaRepository;
    private final LoteMapper mapper;

    public LoteMermaService(LoteMermaRepository loteRepository,
                            MaterialRepository materialRepository,
                            AreaMaquinaRepository areaRepository,
                            LoteMapper mapper) {
        this.loteRepository = loteRepository;
        this.materialRepository = materialRepository;
        this.areaRepository = areaRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<LoteResponse> listar(String estado, Long idArea, Long idMaterial,
                                     LocalDate desde, LocalDate hasta, Integer anio) {
        LocalDate inicio = desde;
        LocalDate fin = hasta;
        if (anio != null) {
            // El año se intersecta con el rango de fechas, no lo reemplaza.
            LocalDate inicioAnio = LocalDate.of(anio, 1, 1);
            LocalDate finAnio = LocalDate.of(anio, 12, 31);
            inicio = inicio == null || inicio.isBefore(inicioAnio) ? inicioAnio : inicio;
            fin = fin == null || fin.isAfter(finAnio) ? finAnio : fin;
        }
        if (inicio != null && fin != null && inicio.isAfter(fin)) {
            return List.of();
        }
        List<LoteMerma> lotes = loteRepository.buscar(
                normalizar(estado), idArea, idMaterial, inicio, fin);
        return mapper.toResponse(lotes);
    }

    @Transactional(readOnly = true)
    public List<Integer> aniosConRegistros() {
        return loteRepository.aniosConRegistros();
    }

    @Transactional(readOnly = true)
    public LoteResponse obtener(Long id) {
        return mapper.toResponse(buscarLote(id));
    }

    @Transactional(readOnly = true)
    public List<LoteResponse> disponibles() {
        return mapper.toResponse(
                loteRepository.findByEstadoAndIdEnvioIsNullOrderByFechaDesc("EN_ALMACEN"));
    }

    @Transactional
    public LoteResponse crear(LoteRequest request) {
        Material material = buscarMaterial(request.idMaterial());
        AreaMaquina area = buscarArea(request.idArea());
        validarActivos(material, area);

        LoteMerma lote = new LoteMerma();
        aplicar(lote, request);
        lote.setEstado("EN_ALMACEN");
        return mapper.toResponse(loteRepository.save(lote));
    }

    @Transactional
    public LoteResponse actualizar(Long id, LoteRequest request) {
        LoteMerma lote = buscarLote(id);
        if (lote.getIdEnvio() != null) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "No se puede editar un lote que ya fue enviado a reciclaje");
        }
        Material material = buscarMaterial(request.idMaterial());
        AreaMaquina area = buscarArea(request.idArea());
        validarActivos(material, area);

        aplicar(lote, request);
        return mapper.toResponse(loteRepository.save(lote));
    }

    @Transactional
    public void eliminar(Long id) {
        LoteMerma lote = buscarLote(id);
        if (lote.getIdEnvio() != null) {
            throw new ApiException(HttpStatus.CONFLICT,
                    "No se puede eliminar un lote que ya fue enviado a reciclaje");
        }
        loteRepository.delete(lote);
    }

    private void aplicar(LoteMerma lote, LoteRequest request) {
        lote.setKilos(request.kilos());
        lote.setFecha(request.fecha());
        lote.setIdMaterial(request.idMaterial());
        lote.setIdArea(request.idArea());
        lote.setMotivo(request.motivo().trim().toUpperCase());
        lote.setObservaciones(recortar(request.observaciones()));
    }

    private void validarActivos(Material material, AreaMaquina area) {
        if (!material.isActivo()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El material seleccionado está inactivo");
        }
        if (!area.isActivo()) {
            throw new ApiException(HttpStatus.BAD_REQUEST,
                    "El área o máquina seleccionada está inactiva");
        }
    }

    private LoteMerma buscarLote(Long id) {
        return loteRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el lote con id " + id));
    }

    private Material buscarMaterial(Long id) {
        return materialRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el material con id " + id));
    }

    private AreaMaquina buscarArea(Long id) {
        return areaRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el área o máquina con id " + id));
    }

    private static String normalizar(String valor) {
        return valor == null || valor.isBlank() ? null : valor.trim().toUpperCase();
    }

    private static String recortar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }
}
