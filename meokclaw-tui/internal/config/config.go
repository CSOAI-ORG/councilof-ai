package config

import (
	"encoding/json"
	"os"
	"path/filepath"
)

// Config holds the application configuration.
type Config struct {
	MCPBridgeURL string   `json:"mcp_bridge_url"`
	ActiveModel  string   `json:"active_model"`
	Models       []string `json:"models"`
	AgentMode    string   `json:"agent_mode"`
	// LicenseTier is populated at startup from auth.VerifyLicense().
	// Persisted to disk on Save() so the status bar can render without re-verifying.
	LicenseTier string `json:"license_tier,omitempty"`
}

// Default returns a default configuration.
func Default() Config {
	return Config{
		MCPBridgeURL: "http://localhost:3101/mcp",
		ActiveModel:  "claude",
		AgentMode:    "ask",
		Models: []string{
			"claude",
			"gpt-4o",
			"gpt-4.1",
			"gemini-2.5-pro",
			"o3-mini",
			"deepseek-r1",
		},
	}
}

// Load reads configuration from the default config path or returns defaults.
func Load() (Config, error) {
	cfg := Default()

	home, err := os.UserHomeDir()
	if err != nil {
		return cfg, nil
	}

	configPath := filepath.Join(home, ".config", "meokclaw", "config.json")
	data, err := os.ReadFile(configPath)
	if err != nil {
		if os.IsNotExist(err) {
			return cfg, nil
		}
		return cfg, err
	}

	if err := json.Unmarshal(data, &cfg); err != nil {
		return cfg, err
	}
	return cfg, nil
}

// Save persists the configuration to disk.
func (c Config) Save() error {
	home, err := os.UserHomeDir()
	if err != nil {
		return err
	}

	configDir := filepath.Join(home, ".config", "meokclaw")
	if err := os.MkdirAll(configDir, 0o755); err != nil {
		return err
	}

	configPath := filepath.Join(configDir, "config.json")
	data, err := json.MarshalIndent(c, "", "  ")
	if err != nil {
		return err
	}

	return os.WriteFile(configPath, data, 0o644)
}
