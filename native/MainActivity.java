package om.fsw.workshop;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(FswPrintPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
