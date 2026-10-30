import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BUYING_ENQUIRIES, buyingAnswer } from "../../../../functions/api/_buying";
import TalkInline from "./TalkInline";

describe("TalkInline", () => {
  it("renders the existing buying answer's three product enquiries as actual HTTPS anchors", () => {
    const html = renderToStaticMarkup(<TalkInline text={buyingAnswer()} />);
    expect(html.match(/<a\s/g)).toHaveLength(3);
    for (const product of BUYING_ENQUIRIES) {
      const href = `https://councilof.ai${product.href}`.replace(/&/g, "&amp;");
      expect(html).toContain(`href="${href}"`);
      expect(html).toContain(`>${product.label}</a>`);
    }
    expect(html).toContain("Ask for a written scope before ordering");
    expect(html).toContain("does not send, book or pay for work");
  });

  it("keeps bold, code, emphasis and plain text while escaping raw HTML in labels", () => {
    const html = renderToStaticMarkup(<TalkInline text={'**bold** `code` _emphasis_ plain [<img src=x>](https://councilof.ai/contact/)'} />);
    expect(html).toContain("<strong>bold</strong>");
    expect(html).toContain(">code</code>");
    expect(html).toContain("<em>emphasis</em>");
    expect(html).toContain("plain ");
    expect(html).toContain("&lt;img src=x&gt;</a>");
    expect(html).not.toContain("<img");
  });

  it.each([
    "javascript:alert(1)",
    "data:text/html,test",
    "//councilof.ai/contact/",
    "https:\\\\councilof.ai/contact/",
    "https://councilof.ai/\\evil",
    "https://councilof.ai/%5cwrong",
    "https://councilof.ai/\u0000wrong",
    "https://councilof.ai/\twrong",
    "https://councilof.ai/%0awrong",
    "https://user:pass@councilof.ai/contact/",
  ])("does not create an anchor for unsafe URL %j", (url) => {
    const html = renderToStaticMarkup(<TalkInline text={`[enquiry](${url})`} />);
    expect(html).not.toContain("<a ");
    expect(html).toContain("enquiry");
  });
});
