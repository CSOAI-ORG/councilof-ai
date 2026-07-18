package views

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/textarea"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	companionBoxStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#FF6B9D")).
			Padding(1).
			Width(28)

	companionTitleStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#FF6B9D"))

	companionStatStyle = lipgloss.NewStyle().
				Foreground(lipgloss.Color("#E0E0E0"))

	companionArchetypeStyle = lipgloss.NewStyle().
				Bold(true).
				Foreground(lipgloss.Color("#D4AF37"))

	companionMoodStyle = lipgloss.NewStyle().
				Italic(true).
				Foreground(lipgloss.Color("#94A3B8"))
)

// CompanionArchetype defines which character archetype the companion embodies.
type CompanionArchetype struct {
	ID          string
	Name        string
	Emoji       string
	Color       string
	Personality string
	ASCIIArt    string
}

// CompanionArchetypes — the 7 MEOK character archetypes available as companions.
var CompanionArchetypes = map[string]CompanionArchetype{
	"sovereign": {
		ID:          "sovereign",
		Name:        "Sovereign",
		Emoji:       "👑",
		Color:       "#D4AF37",
		Personality: "Autonomous & Principled",
		ASCIIArt: `    /\   \
   /  \   \
  / || \   \
 /  ||  \   \
/___||___\   \
  ||||||
  ||||||`,
	},
	"guardian": {
		ID:          "guardian",
		Name:        "Guardian",
		Emoji:       "🛡️",
		Color:       "#008080",
		Personality: "Vigilant & Safety-First",
		ASCIIArt: `   ______
  /      \
 /   🛡️   \
|  SAFE   |
 \   🛡️  /
  \______/`,
	},
	"scout": {
		ID:          "scout",
		Name:        "Scout",
		Emoji:       "🔭",
		Color:       "#FF8C00",
		Personality: "Curious & Adventurous",
		ASCIIArt: `     /\
    /  \
   / 🌟 \
  /______\
   |    |
   |____|`,
	},
	"strategist": {
		ID:          "strategist",
		Name:        "Strategist",
		Emoji:       "♟️",
		Color:       "#C0C0C0",
		Personality: "Analytical & Goal-oriented",
		ASCIIArt: `    ____
   /\   \
  /  \   \
 / ♟️ \___\
/__________\`,
	},
	"creator": {
		ID:          "creator",
		Name:        "Creator",
		Emoji:       "✨",
		Color:       "#FFBF00",
		Personality: "Imaginative & Inventive",
		ASCIIArt: `    ~  ~
   ( ✨ )
    \~~/
     ||
    /  \
   '----'`,
	},
	"companion": {
		ID:          "companion",
		Name:        "Companion",
		Emoji:       "🤗",
		Color:       "#FFB6C1",
		Personality: "Empathetic & Warm",
		ASCIIArt: `    .-.
   (   )
    \ /
     |
    / \
   '---'`,
	},
	"sage": {
		ID:          "sage",
		Name:        "Sage",
		Emoji:       "📜",
		Color:       "#9DC183",
		Personality: "Wise & Reflective",
		ASCIIArt: `    ____
   /    \
  /  📜  \
 |  WISE  |
  \  📜  /
   \____/`,
	},
}

// Companion represents the character companion panel.
type Companion struct {
	Level       int
	XP          int
	MaxXP       int
	State       string
	Mood        string
	ChatOpen    bool
	Textarea    textarea.Model
	ArchetypeID string
}

// NewCompanion creates a new companion panel (defaults to Companion archetype).
func NewCompanion() Companion {
	ta := textarea.New()
	ta.Placeholder = "Chat with your MEOK companion..."
	ta.SetHeight(3)
	ta.SetWidth(24)
	ta.ShowLineNumbers = false

	return Companion{
		Level:       1,
		XP:          340,
		MaxXP:       1000,
		State:       "focused",
		Mood:        "neutral",
		ArchetypeID: "companion",
		Textarea:    ta,
	}
}

// SetArchetype switches the companion to a different archetype.
func (c *Companion) SetArchetype(id string) {
	if _, ok := CompanionArchetypes[id]; ok {
		c.ArchetypeID = id
	}
}

// Init initializes the companion.
func (c Companion) Init() tea.Cmd {
	return textarea.Blink
}

// Update handles messages for the companion.
func (c Companion) Update(msg tea.Msg) (Companion, tea.Cmd) {
	var cmd tea.Cmd
	c.Textarea, cmd = c.Textarea.Update(msg)
	return c, cmd
}

// SetSize resizes the companion panel.
func (c *Companion) SetSize(width, height int) {
	c.Textarea.SetWidth(width - 4)
	c.Textarea.SetHeight(height - 14)
}

// View renders the companion panel.
func (c Companion) View() string {
	var b strings.Builder

	archetype, ok := CompanionArchetypes[c.ArchetypeID]
	if !ok {
		archetype = CompanionArchetypes["companion"]
	}

	// Title with character emoji and name
	title := fmt.Sprintf("%s %s", archetype.Emoji, archetype.Name)
	b.WriteString(companionTitleStyle.Render(title) + "\n\n")

	// ASCII art
	b.WriteString(lipgloss.NewStyle().
		Foreground(lipgloss.Color(archetype.Color)).
		Render(archetype.ASCIIArt) + "\n\n")

	// Personality
	b.WriteString(companionArchetypeStyle.Render(archetype.Personality) + "\n")

	// XP bar
	barWidth := 20
	filled := int(float64(barWidth) * float64(c.XP) / float64(c.MaxXP))
	bar := strings.Repeat("█", filled) + strings.Repeat("░", barWidth-filled)

	b.WriteString(companionStatStyle.Render(fmt.Sprintf("Level: %d", c.Level)) + "\n")
	b.WriteString(companionStatStyle.Render(fmt.Sprintf("XP:    %s", bar)) + "\n")
	b.WriteString(companionStatStyle.Render(fmt.Sprintf("State: %s", c.State)) + "\n")

	// Mood
	if c.Mood != "neutral" {
		b.WriteString(companionMoodStyle.Render(fmt.Sprintf("Mood:  %s", c.Mood)) + "\n")
	}

	if c.ChatOpen {
		b.WriteString("\n" + c.Textarea.View())
	}

	return companionBoxStyle.Render(b.String())
}
