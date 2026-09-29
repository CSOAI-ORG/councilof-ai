// Harness for wilcoyay/copybook-parser: CopybookParser.parse + RecordDecoder.decode (its documented API).
// Values are rendered with toString(), as the project's own CLI (Jackson defaults) would render them.
import java.nio.file.*;
import java.util.*;
import com.wilcoyay.copybook.*;

public class WilcoyayHarness {
    static String q(String s) {
        if (s == null) return "null";
        StringBuilder b = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            if (c == '"' || c == '\\') b.append('\\').append(c);
            else if (c < 0x20 || c > 0x7e) b.append(String.format("\\u%04x", (int) c));
            else b.append(c);
        }
        return b.append('"').toString();
    }
    static String err(Throwable t) { return (t.getClass().getSimpleName() + ": " + t.getMessage()).split("\n")[0]; }
    static void flat(Object v, String name, List<Integer> idx, List<String> out) {
        if (v instanceof Map) {
            for (Map.Entry<?, ?> e : ((Map<?, ?>) v).entrySet()) flat(e.getValue(), String.valueOf(e.getKey()), idx, out);
        } else if (v instanceof List) {
            List<?> l = (List<?>) v;
            for (int i = 0; i < l.size(); i++) { List<Integer> n = new ArrayList<>(idx); n.add(i + 1); flat(l.get(i), name, n, out); }
        } else {
            StringBuilder k = new StringBuilder(name);
            if (!idx.isEmpty()) { k.append("("); for (int i = 0; i < idx.size(); i++) { if (i > 0) k.append(","); k.append(idx.get(i)); } k.append(")"); }
            out.add("{\"name\":" + q(k.toString()) + ",\"value\":" + (v == null ? "null" : q(v.toString())) + "}");
        }
    }
    public static void main(String[] a) throws Exception {
        Map<String, Object> cache = new HashMap<>();
        for (String ln : Files.readAllLines(Paths.get(a[0]))) {
            String[] t = ln.split("\t");
            String bid = t[0], cpy = t[1], rid = t[2], bin = t[3];
            String head = "{\"record\":" + q(rid) + ",";
            if (!cache.containsKey(bid)) {
                try { cache.put(bid, CopybookParser.parse(Files.readString(Paths.get(cpy)))); }
                catch (Throwable e) { cache.put(bid, err(e)); }
            }
            Object sch = cache.get(bid);
            if (sch instanceof String) { System.out.println(head + "\"stage\":\"parse\",\"error\":" + q((String) sch) + "}"); continue; }
            try {
                Map<String, Object> m = RecordDecoder.decode((CopybookField) sch, Files.readAllBytes(Paths.get(bin)));
                List<String> out = new ArrayList<>();
                flat(m, "", new ArrayList<>(), out);
                System.out.println(head + "\"stage\":\"ok\",\"fields\":[" + String.join(",", out) + "]}");
            } catch (Throwable e) {
                System.out.println(head + "\"stage\":\"decode\",\"error\":" + q(err(e)) + "}");
            }
        }
    }
}
