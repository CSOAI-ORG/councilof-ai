package views

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	shellStyle = lipgloss.NewStyle().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#313244")).
			Padding(0)

	fileTreeStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#181825")).
			Foreground(lipgloss.Color("#CDD6F4")).
			Padding(1)

	editorStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Foreground(lipgloss.Color("#CDD6F4")).
			Padding(1)

	terminalStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#11111B")).
			Foreground(lipgloss.Color("#A6E3A1")).
			Padding(1)

	tabActiveStyle = lipgloss.NewStyle().
			Bold(true).
			Background(lipgloss.Color("#6B5BFF")).
			Foreground(lipgloss.Color("#FFFFFF")).
			Padding(0, 2)

	tabInactiveStyle = lipgloss.NewStyle().
				Background(lipgloss.Color("#313244")).
				Foreground(lipgloss.Color("#CDD6F4")).
				Padding(0, 2)
)

// Shell represents the terminal shell coding interface.
type Shell struct {
	Files       []string
	ActiveFile  string
	EditorText  string
	TerminalOut string
	Width       int
	Height      int
}

// NewShell creates a new shell view.
func NewShell() Shell {
	return Shell{
		Files: []string{
			"cmd/meokclaw/main.go",
			"internal/tui/model.go",
			"internal/bridge/mcp.go",
			"internal/config/config.go",
			"go.mod",
		},
		ActiveFile:  "internal/tui/model.go",
		EditorText:  "package tui\n\nimport tea \"github.com/charmbracelet/bubbletea\"\n\ntype Model struct {\n    width  int\n    height int\n}\n",
		TerminalOut: "$ go run ./cmd/meokclaw\nBuilding MEOKCLAW...\nReady.\n",
	}
}

// SetSize resizes the shell view.
func (s *Shell) SetSize(width, height int) {
	s.Width = width
	s.Height = height
}

// View renders the shell interface.
func (s Shell) View() string {
	// Calculate sub-layout dimensions
	sidebarW := min(24, s.Width/4)
	remainingW := s.Width - sidebarW - 2 // borders
	editorH := int(float64(s.Height) * 0.65)
	terminalH := s.Height - editorH - 3

	// Sidebar: file tree
	var sb strings.Builder
	sb.WriteString(lipgloss.NewStyle().Bold(true).Render("Explorer") + "\n\n")
	for _, f := range s.Files {
		if f == s.ActiveFile {
			sb.WriteString(lipgloss.NewStyle().Foreground(lipgloss.Color("#F9E2AF")).Render("▸ "+f) + "\n")
		} else {
			sb.WriteString("  " + f + "\n")
		}
	}
	sidebar := fileTreeStyle.Width(sidebarW).Height(s.Height - 2).Render(sb.String())

	// Editor: tabs + content
	var eb strings.Builder
	for _, f := range s.Files {
		name := f
		if len(name) > 16 {
			name = "..." + name[len(name)-13:]
		}
		if f == s.ActiveFile {
			eb.WriteString(tabActiveStyle.Render(name))
		} else {
			eb.WriteString(tabInactiveStyle.Render(name))
		}
		eb.WriteString(" ")
	}
	eb.WriteString("\n\n")

	// Simple syntax-highlighted-looking content
	lines := strings.Split(s.EditorText, "\n")
	for i, line := range lines {
		eb.WriteString(fmt.Sprintf("%3d │ %s\n", i+1, line))
	}
	editor := editorStyle.Width(remainingW).Height(editorH).Render(eb.String())

	// Terminal panel
	terminal := terminalStyle.Width(remainingW).Height(terminalH).Render(s.TerminalOut)

	// Stack editor + terminal on the right
	rightContent := lipgloss.JoinVertical(lipgloss.Left, editor, terminal)

	// Join sidebar with right content
	content := lipgloss.JoinHorizontal(lipgloss.Top, sidebar, rightContent)

	return shellStyle.Width(s.Width).Height(s.Height).Render(content)
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
