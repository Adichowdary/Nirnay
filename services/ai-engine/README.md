# NIRNAY AI & Computer Vision Microservice (Python)

This microservice handles intensive biometric and video perception tasks for the NIRNAY DoSJE platform:

- **FRS & Liveness Verification (`/api/v1/frs/verify`)**: Anti-spoofing depth & micro-texture verification + face feature vector matching.
- **Real-Time CCTV Headcount (`/api/v1/cctv/headcount`)**: YOLO crowd count analysis with bounding boxes and occupancy ratio.
- **Ghost Beneficiary Detection (`/api/v1/analytics/ghost-detect`)**: Statistical anomaly detection cross-referencing biometric registers vs observed CCTV crowd counts.

## Running Locally

```bash
cd services/ai-engine
python -m venv venv
# Windows: venv\Scripts\activate
# Linux/Mac: source venv/bin/activate
pip install -r requirements.txt
python main.py
# Runs on http://localhost:8000
# OpenAPI Docs: http://localhost:8000/docs
```

## Running with Docker

```bash
docker build -t nirnay-ai-engine .
docker run -p 8000:8000 nirnay-ai-engine
```
