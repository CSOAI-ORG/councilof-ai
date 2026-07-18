import { Github, Globe, ExternalLink } from 'lucide-react'

export default function Footer() {
  return (
    <footer
      className="relative z-50 w-full bg-[#0A0A0F]/90 border-t border-[#2A2A35] py-3 px-4"
      style={{ backdropFilter: 'blur(8px)' }}
    >
      <div className="flex items-center justify-between max-w-screen-2xl mx-auto">
        <p
          className="text-[11px] text-[#5A5A6A]"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          CSOAI Agent 47 Town &mdash; Powered by the CSOAI Superorganism
        </p>

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/CSOAI-ORG"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#5A5A6A] hover:text-[#D4AF37] transition-colors"
          >
            <Github className="w-3 h-3" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <a
            href="https://csoai.org"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#5A5A6A] hover:text-[#D4AF37] transition-colors"
          >
            <Globe className="w-3 h-3" />
            <span className="hidden sm:inline">csoai.org</span>
          </a>
          <a
            href="https://meok.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] text-[#5A5A6A] hover:text-[#D4AF37] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            <span className="hidden sm:inline">meok.ai</span>
          </a>
        </div>
      </div>
    </footer>
  )
}
