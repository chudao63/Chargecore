import 'package:geolocator/geolocator.dart';

class LocationService {
  static double? lat;
  static double? lng;

  /// Lấy vị trí hiện tại (xin quyền nếu cần). Lỗi thì để null, không chặn luồng.
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
        // Nếu lấy vị trí mới quá lâu/timeout, dùng vị trí gần nhất đã biết.
        pos = await Geolocator.getLastKnownPosition();
      }
      if (pos != null) {
        lat = pos.latitude;
        lng = pos.longitude;
      }
    } catch (_) {
      // bỏ qua — watermark sẽ ghi "(chưa lấy được vị trí)"
    }
  }

  static String get label => (lat != null && lng != null)
      ? '${lat!.toStringAsFixed(5)}, ${lng!.toStringAsFixed(5)}'
      : '(chưa lấy được vị trí)';
}
