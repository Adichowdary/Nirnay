import 'dart:convert';
import 'package:flutter/material.dart';

class CCTVViewerScreen extends StatefulWidget {
  const CCTVViewerScreen({super.key});

  @override
  State<CCTVViewerScreen> createState() => _CCTVViewerScreenState();
}

class _CCTVViewerScreenState extends State<CCTVViewerScreen> {
  int _selectedCamera = 0;
  bool _aiOverlayActive = true;
  int _liveCount = 42;
  int _sanctioned = 50;

  final List<Map<String, String>> _cameras = [
    {
      'id': 'CAM-UP-LKO-01',
      'label': 'Dining Hall Main Entrance',
      'institute': 'Ambedkar Hostel Lucknow',
      'status': 'ONLINE',
      'yoloCount': '42',
    },
    {
      'id': 'CAM-UP-LKO-02',
      'label': 'Computer Training Lab 2',
      'institute': 'Skill Center Gomti Nagar',
      'status': 'ONLINE',
      'yoloCount': '28',
    },
    {
      'id': 'CAM-UP-LKO-03',
      'label': 'Hostel Dormitory Corridor A',
      'institute': 'Ambedkar Hostel Lucknow',
      'status': 'ONLINE',
      'yoloCount': '14',
    },
    {
      'id': 'CAM-UP-LKO-04',
      'label': 'Vocational Workshop Floor',
      'institute': 'Skill Center Gomti Nagar',
      'status': 'ANOMALY',
      'yoloCount': '6',
    },
  ];

  @override
  Widget build(BuildContext context) {
    final cam = _cameras[_selectedCamera];
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Stream Display Container
        Container(
          height: 220,
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: Colors.indigo.withOpacity(0.5)),
          ),
          child: Stack(
            children: [
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.videocam, size: 48, color: Colors.indigoAccent),
                    const SizedBox(height: 8),
                    Text(
                      'CCTV FEED: ${cam['id']}',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      '${cam['institute']} • ${cam['label']}',
                      style: const TextStyle(color: Colors.white60, fontSize: 12),
                    ),
                  ],
                ),
              ),
              // AI YOLO Overlay Badge
              if (_aiOverlayActive)
                Positioned(
                  top: 12,
                  left: 12,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.7),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: Colors.cyanAccent),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.psychology, size: 14, color: Colors.cyanAccent),
                        const SizedBox(width: 4),
                        Text(
                          'YOLOv11: ${cam['yoloCount']} Persons Detected',
                          style: const TextStyle(color: Colors.cyanAccent, fontSize: 11, fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                  ),
                ),
              // Live Status Badge
              Positioned(
                top: 12,
                right: 12,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: cam['status'] == 'ONLINE' ? Colors.green.withOpacity(0.8) : Colors.red.withOpacity(0.8),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.fiber_manual_record, size: 10, color: Colors.white),
                      const SizedBox(width: 4),
                      Text(cam['status']!, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // AI Controls
        Card(
          color: const Color(0xFF1E293B),
          child: SwitchListTile(
            title: const Text('AI Headcount & Bounding Boxes', style: TextStyle(color: Colors.white)),
            subtitle: const Text('FastAPI YOLO inference stream', style: TextStyle(color: Color(0xFF94A3B8))),
            value: _aiOverlayActive,
            activeColor: Colors.cyanAccent,
            onChanged: (v) => setState(() => _aiOverlayActive = v),
          ),
        ),
        const SizedBox(height: 12),
        const Text('AVAILABLE FACILITY CAMERAS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        ..._cameras.asMap().entries.map((entry) {
          final idx = entry.key;
          final c = entry.value;
          final isSelected = idx == _selectedCamera;
          return Card(
            color: isSelected ? const Color(0xFF312E81) : const Color(0xFF1E293B),
            child: ListTile(
              leading: Icon(Icons.camera_alt, color: isSelected ? Colors.cyanAccent : Colors.white60),
              title: Text(c['label']!, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
              subtitle: Text('${c['institute']} • ID: ${c['id']}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
              trailing: Text('${c['yoloCount']} heads', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
              onTap: () => setState(() => _selectedCamera = idx),
            ),
          );
        }),
      ],
    );
  }
}
