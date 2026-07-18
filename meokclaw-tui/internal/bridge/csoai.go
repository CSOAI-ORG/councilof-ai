package bridge

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"time"
)

// CSOAIClient is a bridge to the csoai.org compliance platform.
type CSOAIClient struct {
	BaseURL    string
	HTTPClient *http.Client
}

// NewCSOAIClient creates a new CSOAI bridge client.
func NewCSOAIClient(baseURL string) *CSOAIClient {
	if baseURL == "" {
		baseURL = "https://csoai.org"
	}
	return &CSOAIClient{
		BaseURL: baseURL,
		HTTPClient: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
}

// ComplianceMap represents the global compliance region data.
type ComplianceMap struct {
	Version         int      `json:"version"`
	GeneratedAt     string   `json:"generated_at"`
	TotalRegions    int      `json:"total_regions"`
	TotalFrameworks int      `json:"total_frameworks"`
	Regions         []Region `json:"regions"`
}

// Region is a single compliance jurisdiction.
type Region struct {
	ID              string   `json:"id"`
	Name            string   `json:"name"`
	Status          string   `json:"status"`
	StatusLabel     string   `json:"status_label"`
	Color           string   `json:"color"`
	DaysToDeadline  int      `json:"days_to_deadline"`
	DeadlineDate    *string  `json:"deadline_date"`
	Frameworks      []string `json:"frameworks"`
	Agents          int      `json:"agents"`
	ComplianceScore int      `json:"compliance_score"`
	OpenViolations  int      `json:"open_violations"`
}

// DOMEStatus is the global command center snapshot.
type DOMEStatus struct {
	Version          string `json:"version"`
	GeneratedAt      string `json:"generated_at"`
	Status           string `json:"status"`
	Layer            string `json:"layer"`
	Stats            struct {
		ActiveSystems    int `json:"active_systems"`
		PDCACycles       int `json:"pdca_cycles"`
		MCPServers       int `json:"mcp_servers"`
		OpenViolations   int `json:"open_violations"`
		AvgCompliance    int `json:"avg_compliance"`
		PendingApprovals int `json:"pending_approvals"`
	} `json:"stats"`
}

// CouncilVotes represents the BFT council state.
type CouncilVotes struct {
	Version     string `json:"version"`
	GeneratedAt string `json:"generated_at"`
	Council     struct {
		Name               string `json:"name"`
		TotalNodes         int    `json:"total_nodes"`
		OnlineNodes        int    `json:"online_nodes"`
		DegradedNodes      int    `json:"degraded_nodes"`
		FaultTolerance     int    `json:"fault_tolerance"`
		ConsensusThreshold int    `json:"consensus_threshold"`
	} `json:"council"`
	Nodes []struct {
		Region    string `json:"region"`
		Agents    int    `json:"agents"`
		Consensus int    `json:"consensus"`
		Status    string `json:"status"`
		LastSeen  string `json:"last_seen"`
	} `json:"nodes"`
}

// GetComplianceMap fetches the global compliance map.
func (c *CSOAIClient) GetComplianceMap(ctx context.Context) (*ComplianceMap, error) {
	var out ComplianceMap
	if err := c.get(ctx, "/api/map.json", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetDOMEStatus fetches the DOME command center status.
func (c *CSOAIClient) GetDOMEStatus(ctx context.Context) (*DOMEStatus, error) {
	var out DOMEStatus
	if err := c.get(ctx, "/api/dome/status.json", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetCouncilVotes fetches the BFT council voting state.
func (c *CSOAIClient) GetCouncilVotes(ctx context.Context) (*CouncilVotes, error) {
	var out CouncilVotes
	if err := c.get(ctx, "/api/council/votes.json", &out); err != nil {
		return nil, err
	}
	return &out, nil
}

// GetRegion fetches a single region by ID.
func (c *CSOAIClient) GetRegion(ctx context.Context, regionID string) (*Region, error) {
	m, err := c.GetComplianceMap(ctx)
	if err != nil {
		return nil, err
	}
	for _, r := range m.Regions {
		if r.ID == regionID {
			return &r, nil
		}
	}
	return nil, fmt.Errorf("region %q not found", regionID)
}

func (c *CSOAIClient) get(ctx context.Context, path string, out any) error {
	req, err := http.NewRequestWithContext(ctx, "GET", c.BaseURL+path, nil)
	if err != nil {
		return err
	}
	req.Header.Set("Accept", "application/json")

	resp, err := c.HTTPClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("csoai: [%d] %s", resp.StatusCode, string(body))
	}
	if out != nil {
		if err := json.Unmarshal(body, out); err != nil {
			return err
		}
	}
	return nil
}
