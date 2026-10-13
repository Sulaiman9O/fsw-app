package om.fsw.workshop;

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
import com.google.mlkit.vision.text.latin.TextRecognizerOptions;
import com.googlecode.tesseract.android.TessBaseAPI;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

/** Reads text from a photo on the device (no internet). Latin via ML Kit, Arabic via Tesseract. */
@CapacitorPlugin(name = "FswOcr")
public class FswOcrPlugin extends Plugin {

    private Bitmap decode(String dataUrl) {
        String b64 = dataUrl.contains(",") ? dataUrl.substring(dataUrl.indexOf(',') + 1) : dataUrl;
        byte[] bytes = Base64.decode(b64, Base64.DEFAULT);
        Bitmap bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.length);
        int max = Math.max(bmp.getWidth(), bmp.getHeight());
        if (max < 1600) { // upscale small photos a little: helps both engines
            float k = 1600f / max;
            bmp = Bitmap.createScaledBitmap(bmp, Math.round(bmp.getWidth() * k), Math.round(bmp.getHeight() * k), true);
        }
        return bmp;
    }

    private String tessDir() throws Exception {
        File dir = new File(getContext().getFilesDir(), "tess");
        File td = new File(dir, "tessdata");
        if (!td.exists()) td.mkdirs();
        File f = new File(td, "ara.traineddata");
        if (!f.exists()) {
            try (InputStream in = getContext().getAssets().open("tessdata/ara.traineddata");
                 FileOutputStream out = new FileOutputStream(f)) {
                byte[] buf = new byte[65536];
                int n;
                while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            }
        }
        return dir.getAbsolutePath();
    }

    @PluginMethod
    public void read(final PluginCall call) {
        final String img = call.getString("image", "");
        final boolean wantArabic = Boolean.TRUE.equals(call.getBoolean("arabic", true));
        if (img.isEmpty()) { call.reject("no image"); return; }
        new Thread(() -> {
            try {
                final Bitmap bmp = decode(img);
                final JSObject out = new JSObject();
                out.put("w", bmp.getWidth());
                out.put("h", bmp.getHeight());

                // Arabic (Tesseract), synchronous on this thread
                if (wantArabic) {
                    try {
                        TessBaseAPI tess = new TessBaseAPI();
                        if (tess.init(tessDir(), "ara")) {
                            tess.setPageSegMode(TessBaseAPI.PageSegMode.PSM_AUTO);
                            tess.setImage(bmp);
                            out.put("arabic", tess.getUTF8Text());
                        } else out.put("arabic", "");
                        tess.recycle();
                    } catch (Throwable t) {
                        out.put("arabic", "");
                        out.put("arabicError", String.valueOf(t.getMessage()));
                    }
                }

                // Latin (ML Kit), async
                InputImage in = InputImage.fromBitmap(bmp, 0);
                TextRecognition.getClient(TextRecognizerOptions.DEFAULT_OPTIONS).process(in)
                    .addOnSuccessListener(text -> {
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
                        out.put("latin", lines);
                        out.put("latinText", text.getText());
                        call.resolve(out);
                    })
                    .addOnFailureListener(e -> call.reject("latin: " + e.getMessage()));
            } catch (Throwable t) {
                call.reject(String.valueOf(t.getMessage()));
            }
        }).start();
    }
}
