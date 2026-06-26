package com.example.bss_app2

import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.media.MediaMetadataRetriever
import android.net.Uri
import androidx.annotation.NonNull
import androidx.media3.common.MediaItem
import androidx.media3.effect.BitmapOverlay
import androidx.media3.effect.OverlayEffect
import androidx.media3.effect.TextureOverlay
import androidx.media3.transformer.EditedMediaItem
import androidx.media3.transformer.Effects
import androidx.media3.transformer.ExportException
import androidx.media3.transformer.ExportResult
import androidx.media3.transformer.Transformer
import com.google.common.collect.ImmutableList
import io.flutter.embedding.android.FlutterActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.MethodChannel
import java.io.File

class MainActivity : FlutterActivity() {

    private val CHANNEL = "com.bss.video_watermark"

    override fun configureFlutterEngine(@NonNull flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)
        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, CHANNEL)
            .setMethodCallHandler { call, result ->
                if (call.method == "processVideo") {
                    val srcPath = call.argument<String>("srcPath")
                        ?: return@setMethodCallHandler result.error("ARG", "srcPath missing", null)
                    val destPath = call.argument<String>("destPath")
                        ?: return@setMethodCallHandler result.error("ARG", "destPath missing", null)
                    val lines = call.argument<List<String>>("lines") ?: emptyList()
                    startWatermark(srcPath, destPath, lines, result)
                } else {
                    result.notImplemented()
                }
            }
    }

    private fun startWatermark(
        srcPath: String,
        destPath: String,
        lines: List<String>,
        result: MethodChannel.Result
    ) {
        Thread {
            val retriever = MediaMetadataRetriever()
            val frameW: Int
            val frameH: Int
            try {
                retriever.setDataSource(srcPath)
                val rawW = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_WIDTH)?.toInt() ?: 1920
                val rawH = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_HEIGHT)?.toInt() ?: 1080
                val rot = retriever.extractMetadata(MediaMetadataRetriever.METADATA_KEY_VIDEO_ROTATION)?.toInt() ?: 0
                // Swap nếu video được quay 90° hoặc 270° để lấy kích thước frame thực tế
                frameW = if (rot == 90 || rot == 270) rawH else rawW
                frameH = if (rot == 90 || rot == 270) rawW else rawH
            } finally {
                retriever.release()
            }

            // Bitmap đúng kích thước frame: trong suốt phía trên, thanh watermark ở dưới
            val overlayBitmap = createFullFrameOverlay(lines, frameW, frameH)

            runOnUiThread {
                File(destPath).takeIf { it.exists() }?.delete()

                val listener = object : Transformer.Listener {
                    override fun onCompleted(
                        composition: androidx.media3.transformer.Composition,
                        exportResult: ExportResult
                    ) {
                        result.success(null)
                    }

                    override fun onError(
                        composition: androidx.media3.transformer.Composition,
                        exportResult: ExportResult,
                        exportException: ExportException
                    ) {
                        result.error("WATERMARK_ERROR", exportException.message, null)
                    }
                }

                // Dùng default OverlaySettings (full-frame, centered) để bitmap phủ đúng frame
                val overlayEffect = OverlayEffect(
                    ImmutableList.of<TextureOverlay>(
                        BitmapOverlay.createStaticBitmapOverlay(overlayBitmap)
                    )
                )

                val editedItem = EditedMediaItem.Builder(
                    MediaItem.fromUri(Uri.fromFile(File(srcPath)))
                )
                    .setEffects(Effects(listOf(), listOf(overlayEffect)))
                    .build()

                Transformer.Builder(this)
                    .addListener(listener)
                    .build()
                    .start(editedItem, destPath)
            }
        }.start()
    }

    /**
     * Tạo bitmap đúng kích thước frame video.
     * Vùng trên trong suốt, thanh watermark ở phía dưới.
     */
    private fun createFullFrameOverlay(lines: List<String>, width: Int, height: Int): Bitmap {
        val fontSize = (width * 0.026f).coerceIn(15f, 64f)
        val lineHeight = fontSize * 1.34f
        val pad = fontSize * 0.7f
        val barH = (lines.size * lineHeight + pad * 2 - (lineHeight - fontSize)).toInt()

        val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        val barTop = (height - barH).toFloat()

        // Nền tối bán trong suốt
        canvas.drawRect(0f, barTop, width.toFloat(), height.toFloat(),
            Paint().apply { color = Color.argb(0x94, 0, 0, 0) })
        // Vạch accent cam
        canvas.drawRect(0f, barTop, fontSize * 0.35f, height.toFloat(),
            Paint().apply { color = Color.rgb(0xE0, 0x57, 0x1F) })

        val textPaint = Paint().apply {
            color = Color.WHITE
            textSize = fontSize
            isAntiAlias = true
        }
        val maxW = width - pad * 2
        var y = barTop + pad + fontSize
        for (line in lines) {
            val text = if (textPaint.measureText(line) > maxW) {
                var t = line
                while (t.isNotEmpty() && textPaint.measureText("$t…") > maxW) t = t.dropLast(1)
                "$t…"
            } else line
            canvas.drawText(text, pad, y, textPaint)
            y += lineHeight
        }

        return bitmap
    }
}
