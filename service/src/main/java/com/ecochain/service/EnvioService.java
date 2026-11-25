package com.ecochain.service;

import com.ecochain.dto.EnvioRequest;
import com.ecochain.dto.EnvioResponse;
import com.ecochain.dto.LoteResponse;
import com.ecochain.exception.ApiException;
import com.ecochain.model.EnvioReciclaje;
import com.ecochain.model.LoteMerma;
import com.ecochain.repository.EnvioReciclajeRepository;
import com.ecochain.repository.LoteMermaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class EnvioService {

    private final EnvioReciclajeRepository envioRepository;
    private final LoteMermaRepository loteRepository;
    private final LoteMapper mapper;

    public EnvioService(EnvioReciclajeRepository envioRepository,
                        LoteMermaRepository loteRepository,
                        LoteMapper mapper) {
        this.envioRepository = envioRepository;
        this.loteRepository = loteRepository;
        this.mapper = mapper;
    }

    @Transactional(readOnly = true)
    public List<EnvioResponse> listar() {
        List<EnvioReciclaje> envios = envioRepository.findAll(
                Sort.by(Sort.Order.desc("fecha"), Sort.Order.desc("id")));
        Map<Long, List<LoteMerma>> porEnvio = loteRepository.findAll().stream()
                .filter(lote -> lote.getIdEnvio() != null)
                .collect(Collectors.groupingBy(LoteMerma::getIdEnvio));

        return envios.stream()
                .map(envio -> map(envio, porEnvio.getOrDefault(envio.getId(), List.of())))
                .toList();
    }

    @Transactional(readOnly = true)
    public EnvioResponse obtener(Long id) {
        EnvioReciclaje envio = buscarEnvio(id);
        return map(envio, loteRepository.findByIdEnvio(id));
    }

    @Transactional
    public EnvioResponse crear(EnvioRequest request) {
        List<Long> ids = request.loteIds().stream()
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (ids.isEmpty()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Selecciona al menos un lote");
        }

        List<LoteMerma> lotes = new ArrayList<>(loteRepository.findAllById(ids));
        if (lotes.size() != ids.size()) {
            throw new ApiException(HttpStatus.NOT_FOUND, "Uno o más lotes no existen");
        }
        for (LoteMerma lote : lotes) {
            if (lote.getIdEnvio() != null) {
                throw new ApiException(HttpStatus.CONFLICT,
                        "El lote #" + lote.getId() + " ya fue enviado a reciclaje");
            }
        }

        EnvioReciclaje envio = new EnvioReciclaje();
        envio.setFecha(request.fecha());
        envio.setRecicladora(request.recicladora().trim());
        envio.setMontoRecuperado(request.montoRecuperado());
        envio.setNotas(recortar(request.notas()));
        envio = envioRepository.save(envio);

        for (LoteMerma lote : lotes) {
            lote.setIdEnvio(envio.getId());
            lote.setEstado("ENVIADO");
        }
        loteRepository.saveAll(lotes);

        return map(envio, lotes);
    }

    @Transactional
    public void eliminar(Long id) {
        EnvioReciclaje envio = buscarEnvio(id);
        List<LoteMerma> lotes = loteRepository.findByIdEnvio(id);
        for (LoteMerma lote : lotes) {
            lote.setIdEnvio(null);
            lote.setEstado("EN_ALMACEN");
        }
        loteRepository.saveAll(lotes);
        envioRepository.delete(envio);
    }

    private EnvioResponse map(EnvioReciclaje envio, List<LoteMerma> lotes) {
        List<LoteResponse> respuestas = mapper.toResponse(lotes);
        BigDecimal kilos = respuestas.stream()
                .map(LoteResponse::kilos)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal costo = respuestas.stream()
                .map(LoteResponse::costoEstimado)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        return new EnvioResponse(
                envio.getId(),
                envio.getFecha(),
                envio.getRecicladora(),
                envio.getMontoRecuperado(),
                envio.getNotas(),
                kilos.setScale(2, RoundingMode.HALF_UP),
                costo.setScale(2, RoundingMode.HALF_UP),
                respuestas.size(),
                respuestas
        );
    }

    private EnvioReciclaje buscarEnvio(Long id) {
        return envioRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND,
                        "No existe el envío con id " + id));
    }

    private static String recortar(String valor) {
        if (valor == null) {
            return null;
        }
        String limpio = valor.trim();
        return limpio.isEmpty() ? null : limpio;
    }
}
