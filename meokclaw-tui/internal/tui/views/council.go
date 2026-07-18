package views

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	councilBoxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#6B5BFF")).
			Padding(1)

	councilTitleStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#6B5BFF"))

	voteYesStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#4ADE80"))

	voteNoStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#F87171"))

	votePendingStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#94A3B8"))

	agentNameStyle = lipgloss.NewStyle().
			Bold(true).
			Foreground(lipgloss.Color("#E0E0E0"))

	characterEmojiStyle = lipgloss.NewStyle().
				Bold(true)

	archetypeLabelStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#94A3B8")).
				Italic(true)

	expertIdStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#6B7280")).
			Faint(true)
)

// AgentVote represents a single council member's vote.
type AgentVote struct {
	Name          string
	CharacterName string
	CharacterEmoji string
	CharacterColor string
	ExpertID      string
	Vote          string // "yes", "no", "abstain", ""
	Reason        string
	Confidence    float64
}

// Council represents the BFT council visualization.
type Council struct {
	Visible bool
	Agents  []AgentVote
	Topic   string
	Phase   string // "deliberating", "prepared", "committed"
}

// NewCouncil creates a new council view with real MEOK expert characters.
func NewCouncil() Council {
	return Council{
		Visible: false,
		Agents: []AgentVote{
			{
				Name:           "Security Sentinel",
				CharacterName:  "Guardian",
				CharacterEmoji: "🛡️",
				CharacterColor: "#008080",
				ExpertID:       "security_sentinel",
				Vote:           "yes",
				Reason:         "No threats detected",
				Confidence:     0.91,
			},
			{
				Name:           "Compliance Oracle",
				CharacterName:  "Sovereign",
				CharacterEmoji: "👑",
				CharacterColor: "#D4AF37",
				ExpertID:       "compliance_oracle",
				Vote:           "yes",
				Reason:         "Passes guardrails",
				Confidence:     0.88,
			},
			{
				Name:           "Antifragile Architect",
				CharacterName:  "Scout",
				CharacterEmoji: "🔭",
				CharacterColor: "#FF8C00",
				ExpertID:       "antifragile_architect",
				Vote:           "",
				Reason:         "Analyzing stress profile...",
				Confidence:     0.0,
			},
			{
				Name:           "Contrarian Devil",
				CharacterName:  "Sage",
				CharacterEmoji: "📜",
				CharacterColor: "#9DC183",
				ExpertID:       "contrarian_devil",
				Vote:           "no",
				Reason:         "Unanimity may hide groupthink",
				Confidence:     0.72,
			},
			{
				Name:           "Care Governor",
				CharacterName:  "Companion",
				CharacterEmoji: "🤗",
				CharacterColor: "#FFB6C1",
				ExpertID:       "care_governor",
				Vote:           "",
				Reason:         "Checking care floor...",
				Confidence:     0.0,
			},
			{
				Name:           "Temporal Arbitrageur",
				CharacterName:  "Strategist",
				CharacterEmoji: "♟️",
				CharacterColor: "#C0C0C0",
				ExpertID:       "temporal_arbitrageur",
				Vote:           "yes",
				Reason:         "Cost within budget",
				Confidence:     0.85,
			},
			{
				Name:           "Convergence Spotter",
				CharacterName:  "Creator",
				CharacterEmoji: "✨",
				CharacterColor: "#FFBF00",
				ExpertID:       "convergence_spotter",
				Vote:           "yes",
				Reason:         "Alignment confirmed",
				Confidence:     0.79,
			},
		},
		Topic: "Approve LLM routing decision: anthropic/claude-3.5-sonnet",
		Phase: "deliberating",
	}
}

// Init initializes the council.
func (c Council) Init() tea.Cmd {
	return nil
}

// Update handles messages for the council.
func (c Council) Update(msg tea.Msg) (Council, tea.Cmd) {
	return c, nil
}

// SetSize resizes the council panel.
func (c *Council) SetSize(width, height int) {}

// Toggle toggles council visibility.
func (c *Council) Toggle() {
	c.Visible = !c.Visible
}

func voteIcon(vote string) string {
	switch vote {
	case "yes":
		return voteYesStyle.Render("✔ YES")
	case "no":
		return voteNoStyle.Render("✘ NO")
	case "abstain":
		return votePendingStyle.Render("○ ABSTAIN")
	default:
		return votePendingStyle.Render("⋯ PENDING")
	}
}

func phaseBadge(phase string) string {
	switch phase {
	case "deliberating":
		return lipgloss.NewStyle().
			Background(lipgloss.Color("#3B82F6")).
			Foreground(lipgloss.Color("#FFFFFF")).
			Bold(true).
			Padding(0, 1).
			Render(" DELIBERATING ")
	case "prepared":
		return lipgloss.NewStyle().
			Background(lipgloss.Color("#F59E0B")).
			Foreground(lipgloss.Color("#FFFFFF")).
			Bold(true).
			Padding(0, 1).
			Render(" PREPARED ")
	case "committed":
		return lipgloss.NewStyle().
			Background(lipgloss.Color("#10B981")).
			Foreground(lipgloss.Color("#FFFFFF")).
			Bold(true).
			Padding(0, 1).
			Render(" COMMITTED ")
	default:
		return ""
	}
}

// View renders the council panel.
func (c Council) View() string {
	if !c.Visible {
		return ""
	}

	var b strings.Builder
	b.WriteString(councilTitleStyle.Render("⚖️  PBFT-MoE Council") + "  " + phaseBadge(c.Phase) + "\n\n")
	b.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("#94A3B8")).Render("Topic: "+c.Topic) + "\n\n")

	for _, agent := range c.Agents {
		// Character emoji with color
		emoji := characterEmojiStyle.Foreground(lipgloss.Color(agent.CharacterColor)).Render(agent.CharacterEmoji)

		// Name line: Character (Expert)
		nameLine := fmt.Sprintf("%s %s %s",
			emoji,
			agentNameStyle.Render(agent.CharacterName),
			archetypeLabelStyle.Render(fmt.Sprintf("(%s)", agent.Name)),
		)

		// Vote line
		voteLine := fmt.Sprintf("   %-12s %s", "", voteIcon(agent.Vote))
		if agent.Reason != "" {
			voteLine += "  " + lipgloss.NewStyle().Foreground(lipgloss.Color("#94A3B8")).Render(agent.Reason)
		}
		if agent.Confidence > 0 {
			voteLine += lipgloss.NewStyle().Foreground(lipgloss.Color("#6B7280")).Faint(true).Render(
				fmt.Sprintf("  [%.0f%%]", agent.Confidence*100),
			)
		}

		b.WriteString(nameLine + "\n")
		b.WriteString(voteLine + "\n\n")
	}

	// Footer
	approved := 0
	rejected := 0
	pending := 0
	for _, a := range c.Agents {
		switch a.Vote {
		case "yes":
			approved++
		case "no":
			rejected++
		default:
			pending++
		}
	}

	footer := fmt.Sprintf("✔ %d  ✘ %d  ⋯ %d  |  f=1  n=%d  quorum=%d",
		approved, rejected, pending, len(c.Agents), 2*1+1)
	b.WriteString(lipgloss.NewStyle().
		Foreground(lipgloss.Color("#6B7280")).
		Faint(true).
		Render(footer))

	return councilBoxStyle.Render(b.String())
}
