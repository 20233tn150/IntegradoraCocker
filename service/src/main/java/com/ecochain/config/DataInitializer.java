package com.ecochain.config;

import com.ecochain.model.AreaMaquina;
import com.ecochain.model.EnvioReciclaje;
import com.ecochain.model.LoteMerma;
import com.ecochain.model.Material;
import com.ecochain.repository.AreaMaquinaRepository;
import com.ecochain.repository.EnvioReciclajeRepository;
import com.ecochain.repository.LoteMermaRepository;
import com.ecochain.repository.MaterialRepository;
import com.ecochain.service.LoteMapper;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Siembra catálogos y datos de demostración la primera vez que arranca la app.
 * Se puede desactivar con ecochain.seed-demo=false.
 */
@Component
@ConditionalOnProperty(name = "ecochain.seed-demo", havingValue = "true", matchIfMissing = true)
public class DataInitializer implements CommandLineRunner {

    private static final String[] MOTIVOS = {
            "FALLA_CALIBRACION", "CORTE_DEFECTUOSO", "MATERIAL_CADUCADO",
            "ERROR_OPERACION", "CONTAMINACION", "OTRO"
    };

    private static final BigDecimal[] KILOS = {
            new BigDecimal("8.0"), new BigDecimal("15.5"), new BigDecimal("22.0"),
            new BigDecimal("6.4"), new BigDecimal("31.2"), new BigDecimal("11.8"),
            new BigDecimal("18.6"), new BigDecimal("4.9"), new BigDecimal("27.5"),
            new BigDecimal("13.3"), new BigDecimal("9.7"), new BigDecimal("20.4")
    };

    private final MaterialRepository materialRepository;
    private final AreaMaquinaRepository areaRepository;
    private final LoteMermaRepository loteRepository;
    private final EnvioReciclajeRepository envioRepository;

    public DataInitializer(MaterialRepository materialRepository,
                           AreaMaquinaRepository areaRepository,
                           LoteMermaRepository loteRepository,
                           EnvioReciclajeRepository envioRepository) {
        this.materialRepository = materialRepository;
        this.areaRepository = areaRepository;
        this.loteRepository = loteRepository;
        this.envioRepository = envioRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        normalizarLotesExistentes();
        List<Material> materiales = asegurarMateriales();
        List<AreaMaquina> areas = asegurarAreas();

        if (loteRepository.count() == 0) {
            int anio = LocalDate.now().getYear();
            List<LoteMerma> lotes = new ArrayList<>();
            lotes.addAll(sembrarLotes(anio - 1, materiales, areas));
            lotes.addAll(sembrarLotes(anio, materiales, areas));
            lotes = loteRepository.saveAll(lotes);

            Map<Long, Material> porId = materiales.stream()
                    .collect(Collectors.toMap(Material::getId, Function.identity()));
            sembrarEnvios(lotes, porId, anio);
        }
    }

    private void normalizarLotesExistentes() {
        List<LoteMerma> lotes = loteRepository.findAll();
        Set<String> validos = Set.of("EN_ALMACEN", "ENVIADO");
        boolean cambios = false;

        for (LoteMerma lote : lotes) {
            if (lote.getEstado() == null || !validos.contains(lote.getEstado())) {
                lote.setEstado("EN_ALMACEN");
                cambios = true;
            }
            if (lote.getMotivo() == null || lote.getMotivo().isBlank()) {
                lote.setMotivo("OTRO");
                cambios = true;
            }
        }
        if (cambios) {
            loteRepository.saveAll(lotes);
        }
    }

    private List<Material> asegurarMateriales() {
        if (materialRepository.count() > 0) {
            return materialRepository.findAll();
        }

        List<Material> materiales = List.of(
                crearMaterial("PET", "Plásticos", "18.50"),
                crearMaterial("Cartón corrugado", "Papel y cartón", "4.20"),
                crearMaterial("Aluminio", "Metales", "32.00"),
                crearMaterial("Plástico mixto", "Plásticos", "9.80"),
                crearMaterial("Orgánico", "Orgánico", "2.40"),
                crearMaterial("Vidrio", "Vidrio", "6.50")
        );
        return materialRepository.saveAll(materiales);
    }

    private static Material crearMaterial(String nombre, String categoria, String costo) {
        Material material = new Material();
        material.setNombre(nombre);
        material.setCategoria(categoria);
        material.setCostoPorKg(new BigDecimal(costo));
        material.setActivo(true);
        return material;
    }

    private List<AreaMaquina> asegurarAreas() {
        if (areaRepository.count() > 0) {
            return areaRepository.findAll();
        }

        List<AreaMaquina> areas = List.of(
                crearArea("Inyectora 1", "MAQUINA", "Nave A", "Luis Ramírez"),
                crearArea("Extrusora 2", "MAQUINA", "Nave A", "Sofía Méndez"),
                crearArea("Línea de Empaque", "AREA", "Nave B", "Ana Torres"),
                crearArea("Almacén de materia prima", "AREA", "Nave A", "Carlos Ruiz"),
                crearArea("Cocina y comedor", "AREA", "Edificio administrativo", "María López")
        );
        return areaRepository.saveAll(areas);
    }

    private static AreaMaquina crearArea(String nombre, String tipo,
                                         String ubicacion, String responsable) {
        AreaMaquina area = new AreaMaquina();
        area.setNombre(nombre);
        area.setTipo(tipo);
        area.setUbicacion(ubicacion);
        area.setResponsable(responsable);
        area.setActivo(true);
        return area;
    }

    private List<LoteMerma> sembrarLotes(int anio, List<Material> materiales, List<AreaMaquina> areas) {
        int mesMax = anio == LocalDate.now().getYear()
                ? LocalDate.now().getMonthValue() : 12;
        List<LoteMerma> lotes = new ArrayList<>();

        for (int mes = 1; mes <= mesMax; mes++) {
            for (int i = 0; i < 2; i++) {
                int indice = (mes * 2 + i) % materiales.size();
                LoteMerma lote = new LoteMerma();
                lote.setFecha(LocalDate.of(anio, mes, Math.min(3 + i * 11 + mes % 7, 27)));
                lote.setKilos(KILOS[(mes + i) % KILOS.length]);
                lote.setIdMaterial(materiales.get(indice).getId());
                lote.setIdArea(areas.get((mes + i) % areas.size()).getId());
                lote.setMotivo(MOTIVOS[(mes * 2 + i) % MOTIVOS.length]);
                lote.setEstado("EN_ALMACEN");
                lote.setObservaciones(i == 0
                        ? "Registro del turno matutino"
                        : "Detectado en revisión de calidad");
                lotes.add(lote);
            }
        }
        return lotes;
    }

    private void sembrarEnvios(List<LoteMerma> lotes, Map<Long, Material> materiales, int anio) {
        int mesActual = LocalDate.now().getMonthValue();

        List<LoteMerma> actuales = lotes.stream()
                .filter(lote -> lote.getFecha().getYear() == anio)
                .filter(lote -> lote.getFecha().getMonthValue() <= Math.max(1, mesActual - 2))
                .sorted(Comparator.comparing(LoteMerma::getFecha))
                .toList();
        crearEnvio(actuales.stream().limit(5).toList(), materiales,
                "Recicladora Delta", new BigDecimal("0.34"));

        List<LoteMerma> anteriores = lotes.stream()
                .filter(lote -> lote.getFecha().getYear() == anio - 1)
                .sorted(Comparator.comparing(LoteMerma::getFecha).reversed())
                .toList();
        crearEnvio(anteriores.stream().limit(4).toList(), materiales,
                "EcoMetales del Bajío", new BigDecimal("0.41"));
    }

    private void crearEnvio(List<LoteMerma> lotes, Map<Long, Material> materiales,
                            String recicladora, BigDecimal factorRecuperacion) {
        if (lotes.isEmpty()) {
            return;
        }

        BigDecimal costoTotal = lotes.stream()
                .map(lote -> LoteMapper.costoEstimado(lote, materiales.get(lote.getIdMaterial())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        EnvioReciclaje envio = new EnvioReciclaje();
        envio.setFecha(lotes.stream()
                .map(LoteMerma::getFecha)
                .max(LocalDate::compareTo)
                .orElse(LocalDate.now())
                .plusDays(5));
        envio.setRecicladora(recicladora);
        envio.setMontoRecuperado(costoTotal.multiply(factorRecuperacion)
                .setScale(2, RoundingMode.HALF_UP));
        envio.setNotas("Envío de demostración generado automáticamente");
        envio = envioRepository.save(envio);

        for (LoteMerma lote : lotes) {
            lote.setIdEnvio(envio.getId());
            lote.setEstado("ENVIADO");
        }
        loteRepository.saveAll(lotes);
    }
}
