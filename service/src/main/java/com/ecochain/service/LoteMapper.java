package com.ecochain.service;

import com.ecochain.dto.LoteResponse;
import com.ecochain.model.AreaMaquina;
import com.ecochain.model.LoteMerma;
import com.ecochain.model.Material;
import com.ecochain.repository.AreaMaquinaRepository;
import com.ecochain.repository.MaterialRepository;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class LoteMapper {

    private final MaterialRepository materialRepository;
    private final AreaMaquinaRepository areaRepository;

    public LoteMapper(MaterialRepository materialRepository,
                      AreaMaquinaRepository areaRepository) {
        this.materialRepository = materialRepository;
        this.areaRepository = areaRepository;
    }

    public LoteResponse toResponse(LoteMerma lote) {
        Material material = lote.getIdMaterial() == null ? null
                : materialRepository.findById(lote.getIdMaterial()).orElse(null);
        AreaMaquina area = lote.getIdArea() == null ? null
                : areaRepository.findById(lote.getIdArea()).orElse(null);
        return map(lote, material, area);
    }

    public List<LoteResponse> toResponse(List<LoteMerma> lotes) {
        Map<Long, Material> materiales = materialRepository.findAll().stream()
                .collect(Collectors.toMap(Material::getId, Function.identity()));
        Map<Long, AreaMaquina> areas = areaRepository.findAll().stream()
                .collect(Collectors.toMap(AreaMaquina::getId, Function.identity()));

        return lotes.stream()
                .map(lote -> map(lote,
                        lote.getIdMaterial() == null ? null : materiales.get(lote.getIdMaterial()),
                        lote.getIdArea() == null ? null : areas.get(lote.getIdArea())))
                .toList();
    }

    private static LoteResponse map(LoteMerma lote, Material material, AreaMaquina area) {
        return new LoteResponse(
                lote.getId(),
                lote.getKilos(),
                lote.getFecha(),
                lote.getEstado(),
                lote.getMotivo(),
                lote.getObservaciones(),
                lote.getIdMaterial(),
                material != null ? material.getNombre() : null,
                material != null ? material.getCategoria() : null,
                material != null ? material.getCostoPorKg() : null,
                lote.getIdArea(),
                area != null ? area.getNombre() : null,
                lote.getIdEnvio(),
                costoEstimado(lote, material),
                lote.getCreatedAt()
        );
    }

    public static BigDecimal costoEstimado(LoteMerma lote, Material material) {
        if (lote.getKilos() == null || material == null || material.getCostoPorKg() == null) {
            return BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
        }
        return material.getCostoPorKg()
                .multiply(lote.getKilos())
                .setScale(2, RoundingMode.HALF_UP);
    }
}
