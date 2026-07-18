package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"

	"github.com/nicholas/meokclaw-tui/internal/auth"
	"github.com/nicholas/meokclaw-tui/internal/config"
	"github.com/nicholas/meokclaw-tui/internal/tui"
)

var version = "1.0.0-dev"

func main() {
	if len(os.Args) > 1 {
		switch os.Args[1] {
		case "--version", "-v":
			fmt.Printf("meokclaw v%s\n", version)
			os.Exit(0)
		case "--verify-license":
			license := auth.VerifyLicense()
			fmt.Printf("Tier:        %s\n", license.Tier)
			if license.Email != "" {
				fmt.Printf("Email:       %s\n", license.Email)
			}
			fmt.Printf("Offline:     %v\n", license.OfflineMode)
			fmt.Printf("Verified at: %s\n", license.VerifiedAt.Format("2006-01-02 15:04:05"))
			if !license.IsPro() {
				fmt.Printf("\nUpgrade at: %s\n", auth.SubscribeURL())
			}
			os.Exit(0)
		}
	}

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load config: %v\n", err)
		os.Exit(1)
	}

	license := auth.VerifyLicense()
	cfg.LicenseTier = string(license.Tier)

	model := tui.NewAppModel(cfg)

	p := tea.NewProgram(
		model,
		tea.WithAltScreen(),
		tea.WithMouseCellMotion(),
	)

	if _, err := p.Run(); err != nil {
		fmt.Fprintf(os.Stderr, "Error running MEOKCLAW: %v\n", err)
		os.Exit(1)
	}
}
