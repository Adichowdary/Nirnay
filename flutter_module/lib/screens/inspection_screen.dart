import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;

class InspectionScreen extends StatefulWidget {
  final Function(Map<String, Object?>) onPostMessage;

  const InspectionScreen({super.key, required this.onPostMessage});

  @override
  State<InspectionScreen> createState() => _InspectionScreenState();
}

class _InspectionScreenState extends State<InspectionScreen> {
  final _facilityNameController = TextEditingController(text: "Dr. Ambedkar Welfare Hostel & Skill Hub");
  final _instituteIdController = TextEditingController(text: "INST-UP-2024-8819");
  final _notesController = TextEditingController();
  
  double _infraScore = 85;
  double _hygieneScore = 78;
  int _beneficiaryClaimed = 120;
  int _beneficiaryObserved = 88;
  bool _gpsLocked = true;
  double _lat = 26.8467;
  double _lng = 80.9462;
  bool _photoCaptured = false;
  bool _submitted = false;

  void _simulateGpsLock() {
    setState(() {
      _gpsLocked = true;
      _lat = 26.8467 + (DateTime.now().millisecond % 50) * 0.0001;
      _lng = 80.9462 + (DateTime.now().millisecond % 50) * 0.0001;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('ISRO Bhuvan Geofence Locked (±3.8m accuracy)'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _capturePhoto() {
    setState(() {
      _photoCaptured = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Live Geotagged Photo Evidence Captured with Watermark'),
        backgroundColor: Colors.indigo,
      ),
    );
  }

  void _submitInspection() {
    setState(() => _submitted = true);
    final payload = {
      'type': 'inspection-submit',
      'payload': {
        'instituteId': _instituteIdController.text,
        'facilityName': _facilityNameController.text,
        'infraScore': _infraScore.round(),
        'hygieneScore': _hygieneScore.round(),
        'beneficiaryClaimed': _beneficiaryClaimed,
        'beneficiaryObserved': _beneficiaryObserved,
        'delta': _beneficiaryClaimed - _beneficiaryObserved,
        'gps': {'lat': _lat, 'lng': _lng, 'accuracy': 3.8, 'verified': _gpsLocked},
        'photoEvidenceCaptured': _photoCaptured,
        'notes': _notesController.text,
        'timestamp': DateTime.now().toIso8601String(),
        'source': 'niyantra-flutter-mobile'
      }
    };
    widget.onPostMessage(payload);

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Inspection Report Encrypted & Synced to DoSJE NIRNAY Portal'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          color: const Color(0xFF1E293B),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'INSTITUTE IDENTIFICATION',
                      style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.amber.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: const Text('SURPRISE AUDIT', style: TextStyle(color: Colors.amber, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _instituteIdController,
                  style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  decoration: const InputDecoration(
                    labelText: 'Institute / NGO ID',
                    labelStyle: TextStyle(color: Color(0xFF94A3B8)),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF334155))),
                  ),
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _facilityNameController,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Facility Name',
                    labelStyle: TextStyle(color: Color(0xFF94A3B8)),
                    enabledBorder: UnderlineInputBorder(borderSide: BorderSide(color: Color(0xFF334155))),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          color: const Color(0xFF1E293B),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'GEOFENCE & BHUVAN GIS VERIFICATION',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Icon(_gpsLocked ? Icons.gps_fixed : Icons.gps_not_fixed, color: _gpsLocked ? Colors.green : Colors.red),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        _gpsLocked ? 'Locked: $_lat, $_lng (±3.8m Bhuvan GPS)' : 'GPS Not Locked',
                        style: TextStyle(color: _gpsLocked ? Colors.green : Colors.red, fontSize: 13),
                      ),
                    ),
                    ElevatedButton(
                      onPressed: _simulateGpsLock,
                      child: const Text('Refresh GPS'),
                    )
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          color: const Color(0xFF1E293B),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('EVIDENCE CAPTURE', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: _capturePhoto,
                        icon: Icon(_photoCaptured ? Icons.check_circle : Icons.camera_alt, color: _photoCaptured ? Colors.green : Colors.indigoAccent),
                        label: Text(_photoCaptured ? 'Photo Geo-Tagged ✓' : 'Capture Live Photo', style: const TextStyle(color: Colors.white)),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 12),
        Card(
          color: const Color(0xFF1E293B),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('HEADCOUNT & AUDIT METRICS', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Registered Beneficiaries: $_beneficiaryClaimed', style: const TextStyle(color: Colors.white70)),
                    Text('Observed In-Person: $_beneficiaryObserved', style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold)),
                  ],
                ),
                Slider(
                  value: _beneficiaryObserved.toDouble(),
                  min: 0,
                  max: 150,
                  divisions: 30,
                  activeColor: Colors.cyanAccent,
                  onChanged: (v) => setState(() => _beneficiaryObserved = v.round()),
                ),
                Text('Infrastructure Score: ${_infraScore.round()}/100', style: const TextStyle(color: Colors.white70)),
                Slider(
                  value: _infraScore,
                  min: 0,
                  max: 100,
                  divisions: 20,
                  onChanged: (v) => setState(() => _infraScore = v),
                ),
                Text('Hygiene & Living Score: ${_hygieneScore.round()}/100', style: const TextStyle(color: Colors.white70)),
                Slider(
                  value: _hygieneScore,
                  min: 0,
                  max: 100,
                  divisions: 20,
                  onChanged: (v) => setState(() => _hygieneScore = v),
                ),
                TextField(
                  controller: _notesController,
                  maxLines: 2,
                  style: const TextStyle(color: Colors.white),
                  decoration: const InputDecoration(
                    labelText: 'Inspector Remarks / Irregularities',
                    labelStyle: TextStyle(color: Color(0xFF94A3B8)),
                    border: OutlineInputBorder(),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),
        FilledButton.icon(
          onPressed: _gpsLocked ? _submitInspection : null,
          style: FilledButton.styleFrom(
            backgroundColor: const Color(0xFF4F46E5),
            padding: const EdgeInsets.symmetric(vertical: 14),
          ),
          icon: const Icon(Icons.cloud_upload),
          label: Text(
            _submitted ? 'INSPECTION REPORT SUBMITTED ✓' : 'SUBMIT INSPECTION TO NIRNAY CLOUD',
            style: const TextStyle(fontWeight: FontWeight.bold),
          ),
        ),
      ],
    );
  }
}
