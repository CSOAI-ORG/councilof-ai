// SPDX-License-Identifier: Apache-2.0
// Console page: a subject field and the GSPC evidence panel. The panel reads councilof.ai only;
// the console's own data is never sent anywhere. Measurement, not certification.
import * as React from "react";
import { useTranslation } from "react-i18next";
import { DocumentTitle, ListPageHeader } from "@openshift-console/dynamic-plugin-sdk";
import { Button, Form, FormGroup, PageSection, TextInput } from "@patternfly/react-core";
import "../vendor/gspc-panel.js"; // defines <gspc-evidence-panel>; copied from councilof.ai's published bundle

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      "gspc-evidence-panel": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & { subject?: string; transport?: string };
    }
  }
}

const EXAMPLES = [
  "https://councilof.ai/mcp",
  "https://tandem.ac/mcp",
  "94b8831311c24df5e7d93e1f1dc989d24639bbe64abc4034a51d78a0306508e1",
];

// PatternFly tokens -> the panel's frame variables, so it looks native in the console.
const THEME = {
  "--gspc-font": "var(--pf-t--global--font--family--body, RedHatText, sans-serif)",
  "--gspc-accent": "var(--pf-t--global--text--color--link--default, #0066cc)",
  "--gspc-border": "var(--pf-t--global--border--color--default, #c7c7c7)",
  "--gspc-radius": "var(--pf-t--global--border--radius--small, 6px)",
} as React.CSSProperties;

export default function GspcEvidencePage() {
  const { t } = useTranslation("plugin__gspc-evidence-plugin");
  const initial = new URLSearchParams(window.location.search).get("subject") ?? EXAMPLES[0];
  const [draft, setDraft] = React.useState(initial);
  const [subject, setSubject] = React.useState(initial);
  return (
    <>
      <DocumentTitle>{t("GSPC evidence")}</DocumentTitle>
      <ListPageHeader title={t("GSPC evidence")} />
      <PageSection>
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            setSubject(draft.trim());
          }}
        >
          <FormGroup label={t("Subject: MCP server URL, agent card URL, model id, card id or claim id")} fieldId="gspc-subject">
            <TextInput id="gspc-subject" value={draft} onChange={(_e, v) => setDraft(v)} />
          </FormGroup>
          <Button type="submit" variant="primary">
            {t("Read evidence")}
          </Button>
        </Form>
      </PageSection>
      <PageSection>
        <gspc-evidence-panel subject={subject} style={THEME} />
      </PageSection>
    </>
  );
}
