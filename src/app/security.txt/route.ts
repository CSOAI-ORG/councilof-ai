import { NextResponse } from "next/server";

const SECURITY_TXT = `Contact: mailto:security@csoai.org
Expires: 2027-06-15T00:00:00.000Z
Encryption: https://csoai.org/security.asc
Preferred-Languages: en
Canonical: https://csoai.org/.well-known/security.txt
Policy: https://csoai.org/charter
Hiring: https://meok.ai/team
`;

export async function GET() {
  return new NextResponse(SECURITY_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
