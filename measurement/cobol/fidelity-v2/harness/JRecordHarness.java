// Harness for JRecord (two copybook paths). Reads jobs TSV, prints one JSON line per job.
// mode "jrecord": JRecordInterface1.COBOL builder straight from the copybook text.
// mode "cb2xml":  standalone cb2xml API (Cb2Xml2) -> XML file -> JRecordInterface1.CB2XML builder.
// Job column 6 = framing. F: one record per file, IO_FIXED_LENGTH + newLine(bytes) (v1 path, unchanged).
// V: RDW file, IO_VB ("mainframe VB, RDW based") + newReader(file).read() until null; one entry per record.
import java.io.*;
import java.nio.file.*;
import java.util.*;
import net.sf.JRecord.JRecordInterface1;
import net.sf.JRecord.Common.Constants;
import net.sf.JRecord.Common.FieldDetail;
import net.sf.JRecord.Details.AbstractLine;
import net.sf.JRecord.Details.LayoutDetail;
import net.sf.JRecord.Details.RecordDetail;
import net.sf.JRecord.Details.fieldValue.IFieldValue;
import net.sf.JRecord.External.CopybookLoader;
import net.sf.JRecord.IO.AbstractLineReader;
import net.sf.JRecord.Numeric.ICopybookDialects;
import net.sf.JRecord.def.IO.builders.ISchemaIOBuilder;

public class JRecordHarness {
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
    static String err(Throwable t) {
        String m = t.getClass().getSimpleName() + ": " + String.valueOf(t.getMessage());
        return m.split("\n")[0];
    }

    static ISchemaIOBuilder builder(String mode, Path xmlDir, String bid, String cpy, String font, int org) throws Exception {
        ISchemaIOBuilder bld;
        if (mode.equals("jrecord")) {
            bld = JRecordInterface1.COBOL.newIOBuilder(cpy)
                .setFont(font).setFileOrganization(org)
                .setDialect(ICopybookDialects.FMT_MAINFRAME).setSplitCopybook(CopybookLoader.SPLIT_NONE);
        } else {
            Path xml = xmlDir.resolve(bid + ".xml");
            if (!Files.exists(xml)) {
                org.w3c.dom.Document d = net.sf.cb2xml.Cb2Xml2.convertToXMLDOM(new File(cpy), false, ICopybookDialects.FMT_MAINFRAME);
                Files.write(xml, net.sf.cb2xml.Cb2Xml2.convertToXMLString(d).getBytes("UTF-8"));
            }
            bld = JRecordInterface1.CB2XML.newIOBuilder(xml.toString())
                .setFont(font).setFileOrganization(org)
                .setSplitCopybook(CopybookLoader.SPLIT_NONE);
        }
        bld.getLayout();
        return bld;
    }

    static void fields(StringBuilder o, LayoutDetail lay, AbstractLine line) {
        o.append("[");
        RecordDetail r = lay.getRecord(0);
        boolean first = true;
        for (int i = 0; i < r.getFieldCount(); i++) {
            FieldDetail f = r.getField(i);
            if (!first) o.append(",");
            first = false;
            o.append("{\"name\":").append(q(f.getName()));
            try {
                IFieldValue v = line.getFieldValue(f);
                String sv = v.asString();
                o.append(",\"value\":").append(q(sv));
            } catch (Throwable e) {
                o.append(",\"error\":").append(q(err(e)));
            }
            o.append("}");
        }
        o.append("]");
    }

    public static void main(String[] a) throws Exception {
        String mode = a[0];
        Path xmlDir = Paths.get(a[2]);
        Files.createDirectories(xmlDir);
        for (String ln : Files.readAllLines(Paths.get(a[1]))) {
            String[] t = ln.split("\t");
            String bid = t[0], cpy = t[1], rid = t[2], bin = t[3], font = t[4];
            String framing = t.length > 5 ? t[5] : "F";
            StringBuilder o = new StringBuilder();
            o.append("{\"record\":").append(q(rid)).append(",");
            ISchemaIOBuilder bld;
            try {
                bld = builder(mode, xmlDir, bid, cpy, font, framing.equals("V") ? Constants.IO_VB : Constants.IO_FIXED_LENGTH);
            } catch (Throwable e) {
                System.out.println(o.append("\"stage\":\"parse\",\"error\":").append(q(err(e))).append("}"));
                continue;
            }
            if (framing.equals("V")) {
                StringBuilder recs = new StringBuilder("[");
                String after = null;
                int n = 0;
                AbstractLineReader rd = null;
                try {
                    LayoutDetail lay = bld.getLayout();
                    rd = bld.newReader(bin);
                    AbstractLine line;
                    while (n < 10000 && (line = rd.read()) != null) {
                        if (n++ > 0) recs.append(",");
                        recs.append("{\"fields\":");
                        fields(recs, lay, line);
                        recs.append("}");
                    }
                } catch (Throwable e) {
                    after = err(e);
                } finally {
                    try { if (rd != null) rd.close(); } catch (Throwable e) { if (after == null) after = err(e); }
                }
                o.append("\"stage\":\"ok\",\"records\":").append(recs.append("]"));
                if (after != null) o.append(",\"error_after\":").append(q(after));
                System.out.println(o.append("}"));
                continue;
            }
            AbstractLine line;
            LayoutDetail lay;
            try {
                lay = bld.getLayout();
                line = bld.newLine(Files.readAllBytes(Paths.get(bin)));
            } catch (Throwable e) {
                System.out.println(o.append("\"stage\":\"decode\",\"error\":").append(q(err(e))).append("}"));
                continue;
            }
            o.append("\"stage\":\"ok\",\"fields\":");
            fields(o, lay, line);
            System.out.println(o.append("}"));
        }
    }
}
