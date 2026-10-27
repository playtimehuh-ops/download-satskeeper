import 'dart:convert';
import 'dart:math';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'config.dart';

void main() {
  runApp(const SatsKeeperApp());
}

class SatsKeeperApp extends StatelessWidget {
  const SatsKeeperApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'SatsKeeper',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue, brightness: Brightness.dark),
        useMaterial3: true,
      ),
      home: const StartupScreen(),
    );
  }
}

class StartupScreen extends StatefulWidget {
  const StartupScreen({super.key});
  @override
  State<StartupScreen> createState() => _StartupScreenState();
}

class _StartupScreenState extends State<StartupScreen> {
  String? deviceId;

  @override
  void initState() {
    super.initState();
    _loadDeviceId();
  }

  Future<void> _loadDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    String? id = prefs.getString('device_id');
    if (id == null) {
      id = 'mob_${Random().nextInt(999999)}_${DateTime.now().millisecondsSinceEpoch}';
      await prefs.setString('device_id', id);
    }
    setState(() {
      deviceId = id;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (deviceId == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    return ConsentScreen(deviceId: deviceId!);
  }
}

class ConsentScreen extends StatefulWidget {
  final String deviceId;
  const ConsentScreen({super.key, required this.deviceId});
  @override
  State<ConsentScreen> createState() => _ConsentScreenState();
}

class _ConsentScreenState extends State<ConsentScreen> {
  bool isLoading = false;

  Future<void> _giveConsent() async {
    setState(() => isLoading = true);
    try {
      final res = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}api/consent'),
        headers: {'Content-Type': 'application/json', 'x-app-key': AppConfig.appKey},
        body: jsonEncode({'device_id': widget.deviceId, 'opted_in': true, 'consent_version': 'v1'}),
      );
      
      if (res.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setBool('consented', true);
        if (mounted) {
          Navigator.pushReplacement(context, MaterialPageRoute(builder: (_) => DashboardScreen(deviceId: widget.deviceId)));
        }
      } else {
        throw Exception('Server rejected consent');
      }
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: Check API URL or Key')));
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Icon(Icons.wifi_tethering, size: 80, color: Colors.blue),
            const SizedBox(height: 24),
            const Text('Share your unused bandwidth', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            const Text('Your device shares unused internet bandwidth. You earn points. You can turn this off anytime.', textAlign: TextAlign.center, style: TextStyle(color: Colors.grey)),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: isLoading ? null : _giveConsent,
              child: isLoading ? const CircularProgressIndicator() : const Text('I understand, turn on'),
            ),
            const SizedBox(height: 12),
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('No thanks', style: TextStyle(color: Colors.grey)),
            )
          ],
        ),
      ),
    );
  }
}

class DashboardScreen extends StatefulWidget {
  final String deviceId;
  const DashboardScreen({super.key, required this.deviceId});
  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  double points = 0;
  int streak = 0;
  double multiplier = 1.0;
  int threshold = 2500;
  bool canRedeem = false;
  bool isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchLedger();
  }

  Future<void> _fetchLedger() async {
    try {
      // Heartbeat
      await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}api/heartbeat'),
        headers: {'Content-Type': 'application/json', 'x-app-key': AppConfig.appKey},
        body: jsonEncode({'device_id': widget.deviceId}),
      );

      // Get Ledger
      final res = await http.get(
        Uri.parse('${AppConfig.apiBaseUrl}api/ledger?device_id=${widget.deviceId}'),
        headers: {'x-app-key': AppConfig.appKey},
      );

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body)['device'];
        setState(() {
          points = (data['points_balance'] as num).toDouble();
          streak = data['streak'] as int;
          multiplier = (data['multiplier'] as num).toDouble();
          threshold = data['threshold'] as int;
          canRedeem = data['can_redeem'] as bool;
          isLoading = false;
        });
      }
    } catch (e) {
      setState(() => isLoading = false);
    }
  }

  Future<void> _redeem() async {
    try {
      final res = await http.post(
        Uri.parse('${AppConfig.apiBaseUrl}api/redeem'),
        headers: {'Content-Type': 'application/json', 'x-app-key': AppConfig.appKey},
        body: jsonEncode({'device_id': widget.deviceId}),
      );

      if (res.statusCode == 200) {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request sent! Admin will process it.')));
        _fetchLedger();
      } else {
        if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Redemption failed.')));
      }
    } catch (e) {
       if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Network error.')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('SatsKeeper Dashboard')),
      body: isLoading
          ? const Center(child: CircularProgressIndicator())
          : Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(24.0),
                      child: Column(
                        children: [
                          const Text('Points Balance', style: TextStyle(color: Colors.grey)),
                          Text(points.toStringAsFixed(0), style: const TextStyle(fontSize: 48, fontWeight: FontWeight.bold, color: Colors.blue)),
                          const SizedBox(height: 8),
                          Text('Streak: $streak days (${multiplier}x)', style: const TextStyle(color: Colors.grey)),
                        ],
                      ),
                    ),
                  ),
                  const Spacer(),
                  ElevatedButton(
                    onPressed: canRedeem ? _redeem : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.blue,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                    child: Text(canRedeem ? 'Redeem \$${threshold ~/ 100} Gift Card' : 'Need $threshold pts to redeem'),
                  ),
                ],
              ),
            ),
    );
  }
}
