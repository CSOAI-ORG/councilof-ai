import { useState, useEffect } from 'react'
import './CouncilStats.css'

const API_BASE = process.env.REACT_APP_API_URL || 'https://ai-safety-empire-backend-production.up.railway.app'

export default function CouncilStats() {
  const [stats, setStats] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
    const interval = setInterval(fetchStats, 30000) // Update every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchStats = async () => {
    try {
      const [statsRes, leaderboardRes] = await Promise.all([
        fetch(`${API_BASE}/stats/system`),
        fetch(`${API_BASE}/council/leaderboard`)
      ])
      
      const statsData = await statsRes.json()
      const leaderboardData = await leaderboardRes.json()
      
      setStats(statsData)
      setLeaderboard(leaderboardData.leaderboard.slice(0, 5))
      setLoading(false)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setLoading(false)
    }
  }

  if (loading) {
    return <div className="stats-loading">Loading live stats...</div>
  }

  if (!stats) {
    return null
  }

  const councilStats = stats.council_stats || {}
  const ensembleStats = stats.ensemble_stats || {}

  return (
    <div className="council-stats">
      <div className="stats-header">
        <h2>🏛️ Live Council Statistics</h2>
        <div className="trust-badges">
          <span className="badge">⛓️ Blockchain Verified</span>
          <span className="badge">🇪🇺 EU AI Act Compliant</span>
          <span className="badge">🤖 AGI/ASI Ready</span>
          <span className="badge">99.9% Uptime</span>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{councilStats.total_decisions?.toLocaleString() || 0}</div>
          <div className="stat-label">Total Decisions</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{ensembleStats.total_ai_decisions?.toLocaleString() || 0}</div>
          <div className="stat-label">AI Votes Cast</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">{councilStats.ensemble_methods_used || 0}</div>
          <div className="stat-label">Ensemble Methods Used</div>
        </div>

        <div className="stat-card">
          <div className="stat-value">12</div>
          <div className="stat-label">Council AIs</div>
        </div>
      </div>

      {leaderboard.length > 0 && (
        <div className="leaderboard">
          <h3>🏆 Top Performing AIs</h3>
          <div className="leaderboard-list">
            {leaderboard.map((ai, index) => (
              <div key={index} className="leaderboard-item">
                <span className="rank">#{index + 1}</span>
                <span className="ai-name">{ai.ai_name}</span>
                <span className="accuracy">{(ai.accuracy * 100).toFixed(1)}% accuracy</span>
                <span className="weight">Weight: {ai.voting_weight.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ensemble-features">
        <h3>🧠 Ensemble Learning Active</h3>
        <div className="features-grid">
          <div className="feature">✅ Weighted Voting</div>
          <div className="feature">✅ Confidence Weighting</div>
          <div className="feature">✅ Adversarial Testing</div>
          <div className="feature">✅ Swarm Intelligence</div>
          <div className="feature">✅ Knowledge Transfer</div>
          <div className="feature">✅ Temporal Learning</div>
          <div className="feature">✅ Meta-Learning (13th AI)</div>
          <div className="feature">✅ Uncertainty Quantification</div>
        </div>
      </div>
    </div>
  )
}

