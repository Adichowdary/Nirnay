# NIRNAY Edge Surveillance Gateway (C++20)

This high-performance native C++ service runs on institute edge hardware (e.g., Raspberry Pi 5, NVIDIA Jetson Orin Nano, or on-premise NVR):

- **Zero-Copy Video Ingestion**: Directly receives RTSP/ONVIF streams from hostel cameras.
- **Hardware-Assisted Ingestion**: Uses VAAPI / NVDEC / QuickSync decoding.
- **Section 65B Hash Chaining**: Signs every video frame with cryptographic SHA-256 for legal admissibility under the Indian Evidence Act.
- **Embedded Telemetry Server**: Responds to health checks on port `9000`.

## Building Locally

```bash
cd services/edge-streamer
cmake -B build
cmake --build build --config Release
./build/nirnay_edge_gateway
```

## Running with Docker

```bash
docker build -t nirnay-edge-gateway .
docker run -p 9000:9000 nirnay-edge-gateway
```
