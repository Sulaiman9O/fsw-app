package om.fsw.workshop;

import android.content.Context;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Prints an HTML label through Android's print screen (Brother Print Service Plugin picks it up). */
@CapacitorPlugin(name = "FswPrint")
public class FswPrintPlugin extends Plugin {
    private WebView printView; // kept so it is not garbage-collected while printing

    @PluginMethod
    public void printHtml(final PluginCall call) {
        final String html = call.getString("html", "");
        final double w = call.getDouble("widthMm", 62.0);
        final double h = call.getDouble("heightMm", 50.0);
        final String name = call.getString("name", "FSW sticker");
        final boolean color = Boolean.TRUE.equals(call.getBoolean("color", false));
        getActivity().runOnUiThread(() -> {
            try {
                printView = new WebView(getContext());
                printView.setWebViewClient(new WebViewClient() {
                    private boolean done = false;
                    @Override
                    public void onPageFinished(WebView view, String url) {
                        if (done) return;
                        done = true;
                        PrintManager pm = (PrintManager) getActivity().getSystemService(Context.PRINT_SERVICE);
                        PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(name);
                        int wMils = (int) Math.round(w / 25.4 * 1000);
                        int hMils = (int) Math.round(h / 25.4 * 1000);
                        PrintAttributes.MediaSize size = new PrintAttributes.MediaSize(
                                "fsw_" + wMils + "x" + hMils, name, wMils, hMils);
                        PrintAttributes attrs = new PrintAttributes.Builder()
                                .setMediaSize(size)
                                .setMinMargins(PrintAttributes.Margins.NO_MARGINS)
                                .setColorMode(color ? PrintAttributes.COLOR_MODE_COLOR : PrintAttributes.COLOR_MODE_MONOCHROME)
                                .build();
                        pm.print(name, adapter, attrs);
                        call.resolve();
                    }
                });
                printView.loadDataWithBaseURL(null, html, "text/html", "UTF-8", null);
            } catch (Exception e) {
                call.reject(e.getMessage());
            }
        });
    }
}
