import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
import 'main.dart';

/// NIYANTRA Flutter field module — offline-first inspection capture.
/// Run: flutter run -d web-server --web-port=53601 --web-hostname=127.0.0.1
/// Then set NEXT_PUBLIC_FLUTTER_URL=http://127.0.0.1:53601/
///
/// Talks to Next.js host via window.postMessage:
///   Host  -> Flutter: { type: 'host-ready', source: 'niyantra-web' }
///   Flutter -> Host:  { type: 'flutter-ready' | 'inspection-submit', source: 'niyantra-flutter' }

void main() => runApp(const NirnayFieldApp());

class NiyantraFieldApp extends StatelessWidget {
  const NiyantraFieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NIYANTRA Field',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF4F46E5)),
        useMaterial3: true,
      ),
      home: const InspectionFormPage(),
    );
  }
}

class InspectionFormPage extends StatefulWidget {
  const InspectionFormPage({super.key});

  @override
  State<InspectionFormPage> createState() => _InspectionFormPageState();
}

class _InspectionFormPageState extends State<InspectionFormPage> {
  final _notes = TextEditingController();
  double _score = 80;
  bool _gpsLocked = false;
  bool _submitted = false;

  @override
  void initState() {
    super.initState();
    _notifyReady();
    web.window.onMessage.listen((web.MessageEvent e) {
      final data = e.data;
      if (data is String && data.contains('host-ready')) {
        _notifyReady();
      }
    });
  }

  void _post(Map<String, Object?> msg) {
    web.window.parent?.postMessage(
      web.JSString(jsonEncode({...msg, 'source': 'niyantra-flutter'}).toJS),
      '*'.toJS,
    );
  }

  void _notifyReady() => _post({'type': 'flutter-ready'});

  void _submit() {
    setState(() => _submitted = true);
    _post({
      'type': 'inspection-submit',
      'payload': {
        'score': _score.round(),
        'gpsLocked': _gpsLocked,
        'notes': _notes.text,
        'at': DateTime.now().toIso8601String(),
      },
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Field Inspection — Flutter')),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          Card(
            child: SwitchListTile(
              title: const Text('GPS geofence lock (±4m)'),
              subtitle: const Text('Required before submit'),
              value: _gpsLocked,
              onChanged: (v) => setState(() => _gpsLocked = v),
            ),
          ),
          const SizedBox(height: 12),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Facility score: ${_score.round()}/100',
                      style: Theme.of(context).textTheme.titleMedium),
                  Slider(
                    value: _score,
                    min: 0,
                    max: 100,
                    divisions: 20,
                    label: _score.round().toString(),
                    onChanged: (v) => setState(() => _score = v),
                  ),
                  TextField(
                    controller: _notes,
                    maxLines: 3,
                    decoration: const InputDecoration(
                      labelText: 'Field notes (offline-safe)',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          FilledButton.icon(
            onPressed: _gpsLocked ? _submit : null,
            icon: const Icon(Icons.cloud_upload),
            label: Text(_submitted ? 'Submitted ✓' : 'Submit to Web Host'),
          ),
          if (!_gpsLocked)
            const Padding(
              padding: EdgeInsets.only(top: 8),
              child: Text('Lock GPS to enable submit — mirrors web geofence rule.'),
            ),
        ],
      ),
    );
  }
}
