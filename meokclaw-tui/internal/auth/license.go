// Package auth provides MEOKCLAW Pro subscription / license verification.
//
// Free tier:  All core features (shell, council, companion, models, modes)
// Pro tier:   Adds cloud companion sync, voice council, multi-machine sync
//
// License key flow:
//  1. User subscribes at https://meok.ai/checkout → receives MEOKCLAW_API_KEY
//  2. User sets env var MEOKCLAW_API_KEY=mk_... OR saves to ~/.config/meokclaw/auth
//  3. On startup, VerifyLicense() POSTs to https://meok.ai/api/auth/verify
//  4. Result cached for 12h to allow offline use
package auth

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"time"
)

// Tier is the subscription level.
type Tier string

const (
	TierFree Tier = "free"
	TierPro  Tier = "pro"
	TierTeam Tier = "team"
)

// LicenseState holds verified subscription state.
type LicenseState struct {
	Tier        Tier      `json:"tier"`
	Email       string    `json:"email,omitempty"`
	VerifiedAt  time.Time `json:"verified_at"`
	ValidUntil  time.Time `json:"valid_until"`
	APIKey      string    `json:"-"`
	OfflineMode bool      `json:"offline_mode"`
}

// IsPro returns true if the user has an active Pro or Team subscription.
func (l LicenseState) IsPro() bool {
	return l.Tier == TierPro || l.Tier == TierTeam
}

// IsTeam returns true for the Team tier.
func (l LicenseState) IsTeam() bool {
	return l.Tier == TierTeam
}

// VerifyEndpoint is the meok.ai endpoint that exchanges an API key for a tier.
// Overridable via MEOKCLAW_VERIFY_URL for self-hosted or test setups.
var VerifyEndpoint = "https://meok.ai/api/auth/verify"

// CacheTTL is how long a successful verification stays valid offline.
const CacheTTL = 12 * time.Hour

// VerifyLicense attempts to verify the subscription. Resolution order:
//
//  1. MEOKCLAW_API_KEY environment variable
//  2. ~/.config/meokclaw/auth file (JSON: {"api_key":"mk_..."})
//  3. ~/.config/meokclaw/license-cache.json (offline cache, valid within CacheTTL)
//
// On any failure, returns a Free tier LicenseState. Free tier is always usable.
func VerifyLicense() LicenseState {
	apiKey := loadAPIKey()
	if apiKey == "" {
		return LicenseState{Tier: TierFree, VerifiedAt: time.Now()}
	}

	// Try cached state first (allows offline use within TTL)
	if cached, ok := loadCache(); ok && time.Since(cached.VerifiedAt) < CacheTTL {
		cached.APIKey = apiKey
		return cached
	}

	state, err := verifyOnline(apiKey)
	if err != nil {
		// Fall through to cache if available (still within TTL)
		if cached, ok := loadCache(); ok {
			cached.APIKey = apiKey
			cached.OfflineMode = true
			return cached
		}
		return LicenseState{Tier: TierFree, VerifiedAt: time.Now()}
	}

	state.APIKey = apiKey
	saveCache(state)
	return state
}

// loadAPIKey resolves the API key from env or config file.
func loadAPIKey() string {
	if k := os.Getenv("MEOKCLAW_API_KEY"); k != "" {
		return strings.TrimSpace(k)
	}
	home, err := os.UserHomeDir()
	if err != nil {
		return ""
	}
	authPath := filepath.Join(home, ".config", "meokclaw", "auth")
	data, err := os.ReadFile(authPath)
	if err != nil {
		return ""
	}
	var payload struct {
		APIKey string `json:"api_key"`
	}
	if err := json.Unmarshal(data, &payload); err != nil {
		return ""
	}
	return strings.TrimSpace(payload.APIKey)
}

// verifyOnline does the HTTP POST to meok.ai/api/auth/verify.
func verifyOnline(apiKey string) (LicenseState, error) {
	body, _ := json.Marshal(map[string]string{"api_key": apiKey})

	req, err := http.NewRequest("POST", VerifyEndpoint, bytes.NewReader(body))
	if err != nil {
		return LicenseState{}, err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("User-Agent", "meokclaw-tui/v1.0")

	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return LicenseState{}, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return LicenseState{}, errors.New("verify rejected")
	}

	var v struct {
		Tier  string `json:"tier"`
		Email string `json:"email"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&v); err != nil {
		return LicenseState{}, err
	}

	return LicenseState{
		Tier:       Tier(v.Tier),
		Email:      v.Email,
		VerifiedAt: time.Now(),
		ValidUntil: time.Now().Add(CacheTTL),
	}, nil
}

// cachePath returns the path to the offline license cache file.
func cachePath() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(home, ".config", "meokclaw", "license-cache.json"), nil
}

// loadCache reads cached license state from disk.
func loadCache() (LicenseState, bool) {
	path, err := cachePath()
	if err != nil {
		return LicenseState{}, false
	}
	data, err := os.ReadFile(path)
	if err != nil {
		return LicenseState{}, false
	}
	var s LicenseState
	if err := json.Unmarshal(data, &s); err != nil {
		return LicenseState{}, false
	}
	return s, true
}

// saveCache writes the verified license state to disk for offline use.
func saveCache(s LicenseState) {
	path, err := cachePath()
	if err != nil {
		return
	}
	_ = os.MkdirAll(filepath.Dir(path), 0o755)
	data, err := json.Marshal(s)
	if err != nil {
		return
	}
	_ = os.WriteFile(path, data, 0o600)
}

// SubscribeURL returns the URL the user can visit to upgrade.
func SubscribeURL() string {
	return "https://meok.ai/sovereign-pro"
}
