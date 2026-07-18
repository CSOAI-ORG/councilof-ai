package views

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

var (
	statusBarStyle = lipgloss.NewStyle().
			Height(1).
			Background(lipgloss.Color("#1E1E2E"))

	statusLeftStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Foreground(lipgloss.Color("#CBA6F7"))

	statusCenterStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Foreground(lipgloss.Color("#94E2D5"))

	statusRightStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Foreground(lipgloss.Color("#F9E2AF"))

	statusOKStyle = lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Foreground(lipgloss.Color("#4ADE80"))

	statusErrorStyle = lipgloss.NewStyle().
				Background(lipgloss.Color("#1E1E2E")).
				Foreground(lipgloss.Color("#F87171"))
)

// StatusBar represents the bottom status bar.
type StatusBar struct {
	GitBranch      string
	LSPStatus      string
	SOV3Status     string
	ActiveModel    string
	AgentMode      string
	Width          int
}

// NewStatusBar creates a new status bar.
func NewStatusBar() StatusBar {
	return StatusBar{
		GitBranch:   "main",
		LSPStatus:   "gopls ●",
		SOV3Status:  "verified",
		ActiveModel: "claude",
		AgentMode:   "ask",
	}
}

// SetSize resizes the status bar.
func (s *StatusBar) SetSize(width int) {
	s.Width = width
}

func statusColor(status string) lipgloss.Style {
	switch status {
	case "verified", "ok", "connected":
		return statusOKStyle
	case "error", "failed":
		return statusErrorStyle
	default:
		return statusCenterStyle
	}
}

// View renders the status bar.
func (s StatusBar) View() string {
	left := fmt.Sprintf("   %s ", s.GitBranch)
	center := fmt.Sprintf(" LSP: %s ", s.LSPStatus)
	modeStr := fmt.Sprintf(" [%s] ", s.AgentMode)
	right := fmt.Sprintf(" SOV3: %s ", s.SOV3Status)
	modelStr := fmt.Sprintf(" ⚡ %s ", s.ActiveModel)

	leftRendered := statusLeftStyle.Render(left)
	centerRendered := statusCenterStyle.Render(center)
	modeRendered := statusCenterStyle.Render(modeStr)
	rightRendered := statusColor(s.SOV3Status).Render(right)
	modelRendered := statusRightStyle.Render(modelStr)

	// Calculate filler space
	used := lipgloss.Width(leftRendered) + lipgloss.Width(centerRendered) + lipgloss.Width(modeRendered) + lipgloss.Width(rightRendered) + lipgloss.Width(modelRendered)
	filler := strings.Repeat(" ", max(0, s.Width-used))

	return statusBarStyle.Render(leftRendered + centerRendered + modeRendered + filler + rightRendered + modelRendered)
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
