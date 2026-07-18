# MEOKCLAW TUI · Homebrew Formula
#
# To publish:
#   1. Create repo: github.com/CSOAI-ORG/homebrew-meokclaw
#   2. Add a Formula/ directory with this file as Formula/meokclaw.rb
#   3. Tag a release in github.com/CSOAI-ORG/meokclaw-tui (e.g. v1.0.0)
#   4. Update the url + sha256 below
#   5. Users: `brew tap CSOAI-ORG/meokclaw && brew install meokclaw`
#
# To test locally:
#   brew install --build-from-source ./HOMEBREW_FORMULA.rb

class Meokclaw < Formula
  desc "Sovereign AI TUI — Bubble Tea + 33-node BFT council in your terminal"
  homepage "https://meok.ai/meokclaw"
  url "https://github.com/CSOAI-ORG/meokclaw-tui/archive/refs/tags/v1.0.0.tar.gz"
  sha256 "REPLACE_ME_AFTER_FIRST_TAG"
  license "MIT"
  head "https://github.com/CSOAI-ORG/meokclaw-tui.git", branch: "main"

  depends_on "go" => :build

  def install
    system "go", "build",
      "-trimpath",
      "-ldflags", "-s -w -X main.version=#{version}",
      "-o", bin/"meokclaw",
      "./cmd/meokclaw"
  end

  test do
    output = shell_output("#{bin}/meokclaw --version", 1)
    assert_match version.to_s, output
  end

  def caveats
    <<~EOS
      MEOKCLAW Free tier is fully functional out of the box.

      To unlock Pro features (cloud companion sync, voice council, multi-machine
      synchronization), subscribe at:
        #{Formula["meokclaw"].homepage}

      Then either:
        export MEOKCLAW_API_KEY=mk_...

      …or save the key to:
        ~/.config/meokclaw/auth

      Format: {"api_key": "mk_..."}
    EOS
  end
end
