import 'dart:convert';
import 'dart:js_interop';
import 'package:flutter/material.dart';
import 'package:web/web.dart' as web;
import 'screens/inspection_screen.dart';
import 'screens/cctv_viewer_screen.dart';
import 'screens/duty_screen.dart';

void main() => runApp(const NirnayFieldApp());

class NirnayFieldApp extends StatelessWidget {
  const NirnayFieldApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'NIRNAY Field Inspection — DoSJE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: const Color(0xFF0B1120),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF4F46E5),
          secondary: Color(0xFF06B6D4),
          surface: Color(0xFF1E293B),
        ),
        useMaterial3: true,
      ),
      home: const MainNavigationShell(),
    );
  }
}

class MainNavigationShell extends StatefulWidget {
  const MainNavigationShell({super.key});

  @override
  State<MainNavigationShell> createState() => _MainNavigationShellState();
}

class _MainNavigationShellState extends State<MainNavigationShell> {
  int _currentIndex = 0;

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

  void _postMessageToHost(Map<String, Object?> msg) {
    try {
      web.window.parent?.postMessage(
        jsonEncode({...msg, 'source': 'niyantra-flutter'}).toJS,
        '*'.toJS,
      );
    } catch (_) {
      // In standalone mode or dev
    }
  }

  void _notifyReady() => _postMessageToHost({'type': 'flutter-ready'});

  @override
  Widget build(BuildContext context) {
    final screens = [
      InspectionScreen(onPostMessage: _postMessageToHost),
      const CCTVViewerScreen(),
      DutyScreen(onPostMessage: _postMessageToHost),
    ];

    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        elevation: 2,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                color: const Color(0xFF4F46E5).withOpacity(0.2),
                borderRadius: BorderRadius.circular(6),
              ),
              child: const Icon(Icons.shield, color: Color(0xFF818CF8), size: 20),
            ),
            const SizedBox(width: 10),
            const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'NIRNAY FIELD MODULE',
                  style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold, letterSpacing: 0.5),
                ),
                Text(
                  'DoSJE Centralized Mobile Inspection',
                  style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8)),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Container(
            margin: const EdgeInsets.only(right: 12),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.2),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.green.withOpacity(0.5)),
            ),
            child: const Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.circle, color: Colors.green, size: 8),
                SizedBox(width: 4),
                Text('SECURE MESH', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
              ],
            ),
          ),
        ],
      ),
      body: screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        backgroundColor: const Color(0xFF0F172A),
        selectedIndex: _currentIndex,
        onDestinationSelected: (idx) => setState(() => _currentIndex = idx),
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.assignment_outlined),
            selectedIcon: Icon(Icons.assignment, color: Color(0xFF818CF8)),
            label: 'Field Inspection',
          ),
          NavigationDestination(
            icon: Icon(Icons.videocam_outlined),
            selectedIcon: Icon(Icons.videocam, color: Color(0xFF06B6D4)),
            label: 'CCTV Surveillance',
          ),
          NavigationDestination(
            icon: Icon(Icons.shuffle_outlined),
            selectedIcon: Icon(Icons.shuffle, color: Colors.amber),
            label: 'AI Duty Randomizer',
          ),
        ],
      ),
    );
  }
}
