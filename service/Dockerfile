# ---------- Etapa 1: construir el .jar con Maven ----------
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar el pom y descargar dependencias primero (mejora el cache de capas)
COPY pom.xml .
RUN mvn -q -B dependency:go-offline

COPY src ./src
RUN mvn -q -B clean package -DskipTests

# ---------- Etapa 2: ejecutar con OpenJDK 17 ----------
FROM openjdk:17-jdk-alpine
WORKDIR /app

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
