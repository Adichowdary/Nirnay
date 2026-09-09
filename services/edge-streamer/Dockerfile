# NIRNAY Edge Gateway - High-Performance C++20 Stream Ingestor
FROM alpine:3.19 AS builder

RUN apk add --no-cache \
    build-base \
    cmake \
    g++

WORKDIR /build
COPY CMakeLists.txt .
COPY src ./src

RUN cmake -B build -DCMAKE_BUILD_TYPE=Release && \
    cmake --build build --config Release

# Minimal Distroless / Alpine runtime container
FROM alpine:3.19

RUN apk add --no-cache libstdc++ curl
WORKDIR /app

COPY --from=builder /build/build/nirnay_edge_gateway .

EXPOSE 9000

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:9000/health || exit 1

ENTRYPOINT ["./nirnay_edge_gateway"]
