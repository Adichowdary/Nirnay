import 'dart:convert';
import 'package:flutter/material.dart';

class DutyScreen extends StatefulWidget {
  final Function(Map<String, Object?>) onPostMessage;

  const DutyScreen({super.key, required this.onPostMessage});

  @override
  State<DutyScreen> createState() => _DutyScreenState();
}

class _DutyScreenState extends State<DutyScreen> {
  bool _generating = false;
  Map<String, dynamic>? _assignment;

  void _triggerSurpriseAssignment() {
    setState(() => _generating = true);
    
    // Simulate FastAPI AI duty generation
    Future.delayed(const Duration(milliseconds: 600), () {
      setState(() {
        _generating = false;
        _assignment = {
          'id': 'ASG-${DateTime.now().millisecondsSinceEpoch}',
          'inspector': 'Vikramaditya Rathore',
          'cadre': 'Senior Central Auditor',
          'targetInstitute': 'Dr. Ambedkar Hostel & Training Center',
          'location': 'Lucknow, Uttar Pradesh',
          'window': 'Surprise Window (Next 48 Hours)',
          'antiCollusionHash': '0x7F8E9D2A1C3B',
          'cleared': true,
        };
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('AI Anti-Collusion Duty Randomizer: Assigned Successfully!'),
          backgroundColor: Colors.green,
        ),
      );
    });
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
                const Row(
                  children: [
                    Icon(Icons.auto_awesome, color: Colors.amber),
                    SizedBox(width: 8),
                    Text(
                      'AI RANDOM DUTY ASSIGNMENT',
                      style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                const Text(
                  'Applies cryptographic anti-collusion algorithms to ensure inspectors are never assigned to familiar institutions or repeated within 30 days.',
                  style: TextStyle(color: Color(0xFF94A3B8), fontSize: 13),
                ),
                const SizedBox(height: 16),
                FilledButton.icon(
                  onPressed: _generating ? null : _triggerSurpriseAssignment,
                  icon: const Icon(Icons.shuffle),
                  label: Text(_generating ? 'Computing Random Assignment...' : 'Generate Surprise Duty Assignment'),
                ),
              ],
            ),
          ),
        ),
        if (_assignment != null) ...[
          const SizedBox(height: 16),
          Card(
            color: const Color(0xFF0F172A),
            shape: RoundedRectangleBorder(
              side: const BorderSide(color: Colors.green),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        _assignment!['id'],
                        style: const TextStyle(color: Colors.cyanAccent, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: Colors.green.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('ANTI-COLLUSION CLEARED', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const Divider(color: Color(0xFF334155)),
                  const SizedBox(height: 8),
                  Text('Assigned Officer: ${_assignment!['inspector']}', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 15)),
                  Text('Cadre: ${_assignment!['cadre']}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  const SizedBox(height: 8),
                  Text('Target Facility: ${_assignment!['targetInstitute']}', style: const TextStyle(color: Colors.amber, fontWeight: FontWeight.bold)),
                  Text('Region: ${_assignment!['location']}', style: const TextStyle(color: Colors.white70, fontSize: 13)),
                  Text('Time Window: ${_assignment!['window']}', style: const TextStyle(color: Colors.white60, fontSize: 12)),
                  const SizedBox(height: 12),
                  Text('Cryptographic Hash: ${_assignment!['antiCollusionHash']}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11, fontFamily: 'monospace')),
                ],
              ),
            ),
          ),
        ],
      ],
    );
  }
}
