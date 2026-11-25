package com.ecochain.service;

import com.ecochain.dto.DashboardResponse;
import com.ecochain.dto.DashboardResponse.SerieMes;
import com.ecochain.dto.DashboardResponse.TopItem;
import com.ecochain.dto.DashboardResponse.TopMotivo;
import com.ecochain.model.AreaMaquina;
import com.ecochain.model.EnvioReciclaje;
import com.ecochain.model.LoteMerma;
import com.ecochain.model.Material;
import com.ecochain.repository.AreaMaquinaRepository;
import com.ecochain.repository.EnvioReciclajeRepository;
import com.ecochain.repository.LoteMermaRepository;
import com.ecochain.repository.MaterialRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class DashboardService {

    private static final String[] MESES = {
            "Ene", "Feb", "Mar", "Abr", "May", "Jun",
            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    };

    private final LoteMermaRepository loteRepository;
    private final MaterialRepository materialRepository;
    private final AreaMaquinaRepository areaRepository;
    private final EnvioReciclajeRepository envioRepository;

    public DashboardService(LoteMermaRepository loteRepository,
                            MaterialRepository materialRepository,
                            AreaMaquinaRepository areaRepository,
                            EnvioReciclajeRepository envioRepository) {
        this.loteRepository = loteRepository;
        this.materialRepository = materialRepository;
        this.areaRepository = areaRepository;
        this.envioRepository = envioRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse construir(int anio) {
        List<LoteMerma> todos = loteRepository.findAll();
        Map<Long, Material> materiales = materialRepository.findAll().stream()
                .collect(Collectors.toMap(Material::getId, Function.identity()));
        Map<Long, String> nombresAreas = areaRepository.findAll().stream()
                .collect(Collectors.toMap(AreaMaquina::getId, AreaMaquina::getNombre));
        Map<Long, String> nombresMateriales = materiales.values().stream()
                .collect(Collectors.toMap(Material::getId, Material::getNombre));

        List<LoteMerma> actual = porAnio(todos, anio);
        List<LoteMerma> anterior = porAnio(todos, anio - 1);
        List<EnvioReciclaje> envios = envioRepository.findAll();
        List<EnvioReciclaje> enviosAnio = envios.stream()
                .filter(envio -> envio.getFecha() != null && envio.getFecha().getYear() == anio)
                .toList();

        BigDecimal kilosTotales = sumaKilos(actual);
        BigDecimal perdidaBruta = actual.stream()
                .map(lote -> costo(lote, materiales))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal recuperado = enviosAnio.stream()
                .map(EnvioReciclaje::getMontoRecuperado)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
        BigDecimal perdidaNeta = perdidaBruta.subtract(recuperado)
                .setScale(2, RoundingMode.HALF_UP);

        List<LoteMerma> enAlmacen = todos.stream()
                .filter(lote -> lote.getIdEnvio() == null)
                .toList();

        return new DashboardResponse(
                anio,
                loteRepository.aniosConRegistros(),
                kilosTotales,
                perdidaBruta,
                recuperado,
                perdidaNeta,
                actual.size(),
                enviosAnio.size(),
                sumaKilos(enAlmacen),
                enAlmacen.size(),
                serie(actual, anterior, materiales),
                topPorArea(actual, materiales, nombresAreas, kilosTotales),
                topPorMaterial(actual, materiales, nombresMateriales, kilosTotales),
                topMotivos(actual, kilosTotales)
        );
    }

    private List<SerieMes> serie(List<LoteMerma> actual,
                                 List<LoteMerma> anterior,
                                 Map<Long, Material> materiales) {
        List<SerieMes> serie = new ArrayList<>(12);
        for (int mes = 1; mes <= 12; mes++) {
            final int mesActual = mes;
            List<LoteMerma> lotesMes = actual.stream()
                    .filter(lote -> lote.getFecha() != null && lote.getFecha().getMonthValue() == mesActual)
                    .toList();
            List<LoteMerma> lotesMesAnterior = anterior.stream()
                    .filter(lote -> lote.getFecha() != null && lote.getFecha().getMonthValue() == mesActual)
                    .toList();

            BigDecimal perdida = lotesMes.stream()
                    .map(lote -> costo(lote, materiales))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);

            serie.add(new SerieMes(
                    mes,
                    MESES[mes - 1],
                    sumaKilos(lotesMes),
                    sumaKilos(lotesMesAnterior),
                    perdida.setScale(2, RoundingMode.HALF_UP)
            ));
        }
        return serie;
    }

    private List<TopItem> topPorArea(List<LoteMerma> lotes,
                                     Map<Long, Material> materiales,
                                     Map<Long, String> nombres,
                                     BigDecimal totalKilos) {
        Map<Long, List<LoteMerma>> agrupado = lotes.stream()
                .filter(lote -> lote.getIdArea() != null)
                .collect(Collectors.groupingBy(LoteMerma::getIdArea));

        return agrupado.entrySet().stream()
                .map(entry -> {
                    BigDecimal kilos = sumaKilos(entry.getValue());
                    BigDecimal perdida = entry.getValue().stream()
                            .map(lote -> costo(lote, materiales))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new TopItem(
                            entry.getKey(),
                            nombres.getOrDefault(entry.getKey(), "Sin nombre"),
                            kilos,
                            porcentaje(kilos, totalKilos),
                            perdida.setScale(2, RoundingMode.HALF_UP)
                    );
                })
                .sorted((a, b) -> b.kilos().compareTo(a.kilos()))
                .limit(5)
                .toList();
    }

    private List<TopItem> topPorMaterial(List<LoteMerma> lotes,
                                         Map<Long, Material> materiales,
                                         Map<Long, String> nombres,
                                         BigDecimal totalKilos) {
        Map<Long, List<LoteMerma>> agrupado = lotes.stream()
                .filter(lote -> lote.getIdMaterial() != null)
                .collect(Collectors.groupingBy(LoteMerma::getIdMaterial));

        return agrupado.entrySet().stream()
                .map(entry -> {
                    BigDecimal kilos = sumaKilos(entry.getValue());
                    BigDecimal perdida = entry.getValue().stream()
                            .map(lote -> costo(lote, materiales))
                            .reduce(BigDecimal.ZERO, BigDecimal::add);
                    return new TopItem(
                            entry.getKey(),
                            nombres.getOrDefault(entry.getKey(), "Sin nombre"),
                            kilos,
                            porcentaje(kilos, totalKilos),
                            perdida.setScale(2, RoundingMode.HALF_UP)
                    );
                })
                .sorted((a, b) -> b.kilos().compareTo(a.kilos()))
                .limit(5)
                .toList();
    }

    private List<TopMotivo> topMotivos(List<LoteMerma> lotes, BigDecimal totalKilos) {
        Map<String, List<LoteMerma>> agrupado = lotes.stream()
                .collect(Collectors.groupingBy(lote -> lote.getMotivo() == null
                        ? "SIN_MOTIVO" : lote.getMotivo()));

        return agrupado.entrySet().stream()
                .map(entry -> {
                    BigDecimal kilos = sumaKilos(entry.getValue());
                    return new TopMotivo(
                            entry.getKey(),
                            kilos,
                            porcentaje(kilos, totalKilos)
                    );
                })
                .sorted((a, b) -> b.kilos().compareTo(a.kilos()))
                .limit(6)
                .toList();
    }

    private static List<LoteMerma> porAnio(List<LoteMerma> lotes, int anio) {
        return lotes.stream()
                .filter(lote -> lote.getFecha() != null && lote.getFecha().getYear() == anio)
                .toList();
    }

    private static BigDecimal sumaKilos(List<LoteMerma> lotes) {
        return lotes.stream()
                .map(LoteMerma::getKilos)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal costo(LoteMerma lote, Map<Long, Material> materiales) {
        Material material = lote.getIdMaterial() == null ? null : materiales.get(lote.getIdMaterial());
        return LoteMapper.costoEstimado(lote, material);
    }

    private static double porcentaje(BigDecimal parte, BigDecimal total) {
        if (parte == null || total == null || total.signum() <= 0) {
            return 0.0;
        }
        return parte.multiply(BigDecimal.valueOf(100))
                .divide(total, 1, RoundingMode.HALF_UP)
                .doubleValue();
    }
}
