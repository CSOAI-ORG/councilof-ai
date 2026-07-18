package tui

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/list"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"

	"github.com/nicholas/meokclaw-tui/internal/bridge"
	"github.com/nicholas/meokclaw-tui/internal/config"
	"github.com/nicholas/meokclaw-tui/internal/tui/views"
)

// AppModel is the main Bubble Tea model for MEOKCLAW.
type AppModel struct {
	Config     config.Config
	MCP        *bridge.Client
	Width      int
	Height     int
	Shell      views.Shell
	Companion  views.Companion
	Council    views.Council
	StatusBar  views.StatusBar
	ModelList  list.Model
	ShowModels bool
	ModeList   list.Model
	ShowModes  bool
}

// NewAppModel creates a new application model.
func NewAppModel(cfg config.Config) AppModel {
	mcp := bridge.NewClient(cfg.MCPBridgeURL)

	// Setup model switcher list
	items := make([]list.Item, len(cfg.Models))
	for i, model := range cfg.Models {
		items[i] = modelItem{name: model}
	}

	modelList := list.New(items, list.NewDefaultDelegate(), 30, 14)
	modelList.Title = "Switch Model"
	modelList.SetShowStatusBar(false)
	modelList.SetFilteringEnabled(false)
	modelList.SetShowHelp(false)

	// Setup mode switcher list
	modeItems := []list.Item{
		modeItem{name: "ask", label: "💬 Ask"},
		modeItem{name: "architect", label: "🏗️ Architect"},
		modeItem{name: "code", label: "💻 Code"},
		modeItem{name: "debug", label: "🐛 Debug"},
		modeItem{name: "orchestrator", label: "🎯 Orchestrator"},
	}
	modeList := list.New(modeItems, list.NewDefaultDelegate(), 30, 14)
	modeList.Title = "Switch Mode"
	modeList.SetShowStatusBar(false)
	modeList.SetFilteringEnabled(false)
	modeList.SetShowHelp(false)

	return AppModel{
		Config:    cfg,
		MCP:       mcp,
		Shell:     views.NewShell(),
		Companion: views.NewCompanion(),
		Council:   views.NewCouncil(),
		StatusBar: views.NewStatusBar(),
		ModelList: modelList,
		ModeList:  modeList,
	}
}

// Init initializes the application.
func (m AppModel) Init() tea.Cmd {
	return tea.Batch(
		m.Companion.Init(),
		m.Council.Init(),
	)
}

// Update handles messages.
func (m AppModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		m.Width = msg.Width
		m.Height = msg.Height
		m.Shell.SetSize(m.Width, m.Height-1)
		m.StatusBar.SetSize(m.Width)
		m.Companion.SetSize(28, m.Height/3)
		m.Council.SetSize(m.Width/2, m.Height/2)
		m.ModelList.SetSize(30, min(14, m.Height-4))
		m.ModeList.SetSize(30, min(14, m.Height-4))
		return m, nil

	case tea.KeyMsg:
		if m.ShowModels {
			switch msg.String() {
			case "ctrl+c", "esc", "q":
				m.ShowModels = false
				return m, nil
			case "enter":
				if i, ok := m.ModelList.SelectedItem().(modelItem); ok {
					m.Config.ActiveModel = i.name
					m.StatusBar.ActiveModel = i.name
					_ = m.Config.Save()
				}
				m.ShowModels = false
				return m, nil
			}
			var cmd tea.Cmd
			m.ModelList, cmd = m.ModelList.Update(msg)
			return m, cmd
		}

		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "ctrl+n":
			m.Shell.TerminalOut += "\n[New session started]\n$ "
			return m, nil
		case "ctrl+m":
			m.ShowModels = !m.ShowModels
			return m, nil
		case "ctrl+b":
			m.Council.Toggle()
			return m, nil
		case "ctrl+k":
			m.Companion.ChatOpen = !m.Companion.ChatOpen
			return m, nil
		case "ctrl+/":
			m.Shell.TerminalOut += "\n[Command palette: type a command]\n$ "
			return m, nil
		}
	}

	var cmds []tea.Cmd

	// Update sub-components
	var companionCmd tea.Cmd
	m.Companion, companionCmd = m.Companion.Update(msg)
	cmds = append(cmds, companionCmd)

	var councilCmd tea.Cmd
	m.Council, councilCmd = m.Council.Update(msg)
	cmds = append(cmds, councilCmd)

	return m, tea.Batch(cmds...)
}

// View renders the full application.
func (m AppModel) View() string {
	if m.Width == 0 || m.Height == 0 {
		return "Loading MEOKCLAW..."
	}

	var b strings.Builder

	// Main layout: shell on left, companion on right
	shellW := m.Width - 30
	if shellW < 20 {
		shellW = m.Width
	}

	m.Shell.SetSize(shellW, m.Height-1)

	shellView := m.Shell.View()
	companionView := m.Companion.View()

	// If council is visible, overlay it or place it
	councilView := m.Council.View()

	// Build main content area
	var mainContent string
	if m.Width > 60 {
		mainContent = lipgloss.JoinHorizontal(lipgloss.Top, shellView, companionView)
	} else {
		mainContent = shellView
	}

	// Overlay council if visible
	if councilView != "" {
		overlay := lipgloss.NewStyle().
			Width(m.Width / 2).
			Align(lipgloss.Center).
			Render(councilView)
		mainContent = placeOverlay(mainContent, overlay, m.Width, m.Height-1)
	}

	b.WriteString(mainContent + "\n")
	b.WriteString(m.StatusBar.View())

	// Mode switcher overlay
	if m.ShowModes {
		overlay := lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#F59E0B")).
			Padding(1).
			Width(32).
			Render(m.ModeList.View())

		return placeOverlay(b.String(), overlay, m.Width, m.Height)
	}

	// Model switcher overlay
	if m.ShowModels {
		overlay := lipgloss.NewStyle().
			Background(lipgloss.Color("#1E1E2E")).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(lipgloss.Color("#6B5BFF")).
			Padding(1).
			Width(32).
			Render(m.ModelList.View())

		return placeOverlay(b.String(), overlay, m.Width, m.Height)
	}

	return b.String()
}

// modelItem is a list item for the model switcher.
type modelItem struct {
	name string
}

func (m modelItem) FilterValue() string { return m.name }
func (m modelItem) Title() string       { return m.name }
func (m modelItem) Description() string { return fmt.Sprintf("Switch to %s", m.name) }

// modeItem is a list item for the mode switcher.
type modeItem struct {
	name  string
	label string
}

func (m modeItem) FilterValue() string { return m.name }
func (m modeItem) Title() string       { return m.label }
func (m modeItem) Description() string { return fmt.Sprintf("Activate %s mode", m.name) }

// placeOverlay places a centered overlay on top of content.
func placeOverlay(content, overlay string, width, height int) string {
	lines := strings.Split(content, "\n")
	overlayLines := strings.Split(overlay, "\n")
	overlayH := len(overlayLines)
	overlayW := 0
	for _, l := range overlayLines {
		if lipgloss.Width(l) > overlayW {
			overlayW = lipgloss.Width(l)
		}
	}

	startY := (height - overlayH) / 2
	if startY < 0 {
		startY = 0
	}
	startX := (width - overlayW) / 2
	if startX < 0 {
		startX = 0
	}

	var out strings.Builder
	for i, line := range lines {
		if i >= startY && i < startY+overlayH {
			ol := overlayLines[i-startY]
			olw := lipgloss.Width(ol)
			if startX+olw > len(line) {
				out.WriteString(line[:min(startX, len(line))] + ol + "\n")
			} else {
				out.WriteString(line[:startX] + ol + line[startX+olw:] + "\n")
			}
		} else {
			out.WriteString(line + "\n")
		}
	}
	return out.String()
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
