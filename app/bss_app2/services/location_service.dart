import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';

class LocationService {
  static double? lat;
  static double? lng;
  static String address = ''; // địa danh: xã/phường, (huyện cũ nếu có), tỉnh/thành

  /// Lấy vị trí hiện tại + địa danh. Lỗi/mất mạng thì để trống, không chặn luồng.
  static Future<void> refresh() async {
    try {
      var perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.denied ||
          perm == LocationPermission.deniedForever) {
        return;
      }
      if (!await Geolocator.isLocationServiceEnabled()) return;

      Position? pos;
      try {
        pos = await Geolocator.getCurrentPosition(
          desiredAccuracy: LocationAccuracy.high,
          timeLimit: const Duration(seconds: 8),
        );
      } catch (_) {
        pos = await Geolocator.getLastKnownPosition();
      }
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
        await _resolveAddress();
      }
    } catch (_) {
      // bỏ qua
    }
  }

  /// Tra địa danh tiếng Việt từ toạ độ qua dịch vụ OpenStreetMap (cần internet).
  /// Mất mạng / lỗi -> để trống, vẫn còn toạ độ GPS.
  static Future<void> _resolveAddress() async {
    try {
      if (lat == null || lng == null) return;
      final uri = Uri.parse(
        'https://nominatim.openstreetmap.org/reverse'
        '?format=jsonv2&lat=$lat&lon=$lng&accept-language=vi&zoom=14&addressdetails=1',
      );
      final resp = await http.get(
        uri,
        headers: {'User-Agent': 'BSS-Checksheet/1.0 (field inspection app)'},
      ).timeout(const Duration(seconds: 8));
      if (resp.statusCode != 200) return;

      final data = jsonDecode(resp.body) as Map<String, dynamic>;
      final a = (data['address'] as Map?)?.cast<String, dynamic>() ?? {};
      // Thứ tự từ nhỏ đến lớn: phường/xã -> (huyện cũ) -> tỉnh/thành
      const keys = [
        'quarter', 'ward', 'suburb', 'neighbourhood', 'village', 'hamlet',
        'town', 'city', 'municipality', 'county', 'city_district', 'state',
      ];
      final seen = <String>{};
      final parts = <String>[];
      for (final k in keys) {
        final v = (a[k] ?? '').toString().trim();
        if (v.isNotEmpty && seen.add(v)) parts.add(v);
      }
      address = parts.join(', ');
    } catch (_) {
      // bỏ qua
    }
  }

  static String get label => (lat != null && lng != null)
      ? '${lat!.toStringAsFixed(5)}, ${lng!.toStringAsFixed(5)}'
      : '(chưa lấy được vị trí)';
}
