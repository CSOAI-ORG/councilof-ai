import { FrameworkReferencePage } from "./FrameworkLandingPage";

export default function CanadaAIActPage() {
  return (
    <FrameworkReferencePage
      region="Canada"
      introduction="Inspect the legislative record and the status of each Canadian AI reference. The proposed Artificial Intelligence and Data Act in Bill C-27 is not an enacted compliance regime or a September 2026 deadline."
      sources={[
        {
          title: "Bill C-27: parliamentary record",
          status: "Historical legislative proposal",
          description: "The record for the 44th Parliament, first session, lists consideration in committee as incomplete. Third reading and Senate stages were not reached. Check this record rather than treating the proposed AIDA requirements as enacted law.",
          href: "https://www.parl.ca/legisinfo/en/bill/44-1/c-27",
        },
        {
          title: "AIDA: government background",
          status: "Archived government page",
          description: "The government marks its AIDA page as archived and describes the Act as proposed. It is background material for research, not confirmation of a current legal duty, penalty or implementation date.",
          href: "https://ised-isde.canada.ca/site/innovation-better-canada/en/artificial-intelligence-and-data-act",
        },
      ]}
    />
  );
}
