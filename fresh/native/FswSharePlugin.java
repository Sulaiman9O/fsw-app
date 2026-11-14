package om.fsw.garage;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.net.Uri;
import android.util.Base64;
import androidx.core.content.FileProvider;
import java.io.File;
import java.io.FileOutputStream;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** ShopFlo: hands a file (the invoice PDF) to WhatsApp or the share sheet. */
@CapacitorPlugin(name = "FswShare")
public class FswSharePlugin extends Plugin {
    /** Sends a PDF (base64) straight to the customer's WhatsApp chat; if WhatsApp is not there, the Android share sheet. */
    @PluginMethod
    public void sharePdf(final PluginCall call) {
        try {
            String b64 = call.getString("b64", "");
            String name = call.getString("name", "Invoice.pdf").replaceAll("[^A-Za-z0-9._-]", "_");
            String phone = call.getString("phone", "").replaceAll("[^0-9]", "");
            String text = call.getString("text", "");
            File dir = new File(getContext().getCacheDir(), "share");
            dir.mkdirs();
            File[] old = dir.listFiles();
            if (old != null) for (File f : old) f.delete();
            File out = new File(dir, name);
            try (FileOutputStream fo = new FileOutputStream(out)) { fo.write(Base64.decode(b64, Base64.DEFAULT)); }
            Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", out);
            Intent in = new Intent(Intent.ACTION_SEND);
            in.setType("application/pdf");
            in.putExtra(Intent.EXTRA_STREAM, uri);
            if (!text.isEmpty()) in.putExtra(Intent.EXTRA_TEXT, text);
            in.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
            if (!phone.isEmpty()) in.putExtra("jid", phone + "@s.whatsapp.net");
            for (String pkg : new String[]{"com.whatsapp", "com.whatsapp.w4b"}) {
                try { Intent w = new Intent(in); w.setPackage(pkg); getActivity().startActivity(w); call.resolve(); return; }
                catch (ActivityNotFoundException e) { /* try the next */ }
            }
            in.removeExtra("jid");
            getActivity().startActivity(Intent.createChooser(in, name).addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
            call.resolve();
        } catch (Exception e) {
            call.reject(e.getMessage());
        }
    }
}
