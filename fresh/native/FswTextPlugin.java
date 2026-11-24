package om.fsw.garage;

import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Rect;
import android.util.Base64;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.mlkit.vision.common.InputImage;
import com.google.mlkit.vision.text.Text;
import com.google.mlkit.vision.text.TextRecognition;
import com.google.mlkit.vision.text.TextRecognizer;
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;

/** Reads printed text (the VIN) from a photo with Google's on-device reader (ML Kit, bundled model: no internet). */
@CapacitorPlugin(name = "FswText")
public class FswTextPlugin extends Plugin {
    private TextRecognizer rec;

    private TextRecognizer rec() {
        if (rec == null) rec = TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS);
        return rec;
    }

    @PluginMethod
    public void read(final PluginCall call) {
        final String img = call.getString("image", "");
        if (img.isEmpty()) { call.reject("no image"); return; }
        new Thread(() -> {
            try {
                String b64 = img.contains(",") ? img.substring(img.indexOf(',') + 1) : img;
                byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
                Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
                if (bmp == null) { call.reject("bad image"); return; }
                int max = Math.max(bmp.getWidth(), bmp.getHeight());
                if (max < 1280) { // small photos: a little bigger reads better
                    float k = 1280f / max;
                    bmp = Bitmap.createScaledBitmap(bmp, Math.round(bmp.getWidth() * k), Math.round(bmp.getHeight() * k), true);
                }
                final int w = bmp.getWidth(), h = bmp.getHeight();
                rec().process(InputImage.fromBitmap(bmp, 0))
                    .addOnSuccessListener(text -> {
                        JSObject out = new JSObject();
                        JSArray lines = new JSArray();
                        for (Text.TextBlock b : text.getTextBlocks()) {
                            for (Text.Line l : b.getLines()) {
                                JSObject o = new JSObject();
                                o.put("t", l.getText());
                                Rect r = l.getBoundingBox();
                                if (r != null) { o.put("x", r.left); o.put("y", r.top); o.put("w", r.width()); o.put("h", r.height()); }
                                lines.put(o);
                            }
                        }
                        out.put("text", text.getText());
                        out.put("lines", lines);
                        out.put("w", w);
                        out.put("h", h);
                        call.resolve(out);
                    })
                    .addOnFailureListener(e -> call.reject("read: " + e.getMessage()));
            } catch (Throwable t) {
                call.reject(String.valueOf(t.getMessage()));
            }
        }).start();
    }
}
