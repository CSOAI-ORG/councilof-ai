import React, { useState } from 'react'
import './WaitlistForm.css'

function WaitlistForm({ inline = false }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: '',
    volume: '',
    timeline: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      // Send to backend API
      const response = await fetch('https://ai-safety-empire-production.up.railway.app/api/v1/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          timestamp: new Date().toISOString(),
          source: 'councilof.ai',
          platform: 'councilof'
        })
      })

      if (response.ok) {
        setSubmitted(true)
        // Also store in localStorage as backup
        const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]')
        waitlist.push({ ...formData, timestamp: new Date().toISOString() })
        localStorage.setItem('waitlist', JSON.stringify(waitlist))
      } else {
        // Fallback to localStorage only if API fails
        console.error('API submission failed, using localStorage')
        const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]')
        waitlist.push({ ...formData, timestamp: new Date().toISOString() })
        localStorage.setItem('waitlist', JSON.stringify(waitlist))
        setSubmitted(true)
      }
    } catch (error) {
      // Fallback to localStorage on network error
      console.error('Network error, using localStorage:', error)
      const waitlist = JSON.parse(localStorage.getItem('waitlist') || '[]')
      waitlist.push({ ...formData, timestamp: new Date().toISOString() })
      localStorage.setItem('waitlist', JSON.stringify(waitlist))
      setSubmitted(true)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  if (submitted) {
    return (
      <div className={`waitlist-success ${inline ? 'inline' : ''}`}>
        <div className="success-icon">✓</div>
        <h3>You're on the list!</h3>
        <p>We'll notify you as soon as councilof.ai launches.</p>
        <p className="success-detail">Check your email for confirmation.</p>
      </div>
    )
  }

  return (
    <form className={`waitlist-form ${inline ? 'inline' : ''}`} onSubmit={handleSubmit}>
      {!inline && <h2>Join the Waitlist</h2>}
      {!inline && <p className="waitlist-subtitle">Be among the first to access democratic AI governance</p>}
      
      <div className="form-grid">
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Your name"
            required
          />
        </div>

        <div className="form-group">
          <label>Email Address *</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="you@company.com"
            required
          />
        </div>

        <div className="form-group">
          <label>Company / Organization</label>
          <input
            type="text"
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Your company"
          />
        </div>

        <div className="form-group">
          <label>Primary Use Case *</label>
          <select name="useCase" value={formData.useCase} onChange={handleChange} required>
            <option value="">Select use case</option>
            <option value="governance">AI Governance & Compliance</option>
            <option value="decision">Decision Making</option>
            <option value="risk">Risk Assessment</option>
            <option value="content">Content Moderation</option>
            <option value="hiring">Hiring & HR</option>
            <option value="finance">Financial Services</option>
            <option value="healthcare">Healthcare</option>
            <option value="legal">Legal & Compliance</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div className="form-group">
          <label>Expected Monthly Volume</label>
          <select name="volume" value={formData.volume} onChange={handleChange}>
            <option value="">Select volume</option>
            <option value="1-1000">1 - 1,000 decisions</option>
            <option value="1000-10000">1,000 - 10,000 decisions</option>
            <option value="10000-100000">10,000 - 100,000 decisions</option>
            <option value="100000+">100,000+ decisions</option>
          </select>
        </div>

        <div className="form-group">
          <label>When do you need this?</label>
          <select name="timeline" value={formData.timeline} onChange={handleChange}>
            <option value="">Select timeline</option>
            <option value="asap">As soon as possible</option>
            <option value="1-3months">1-3 months</option>
            <option value="3-6months">3-6 months</option>
            <option value="6-12months">6-12 months</option>
            <option value="exploring">Just exploring</option>
          </select>
        </div>
      </div>

      <button type="submit" className="btn-primary btn-large" disabled={loading}>
        {loading ? 'Joining...' : 'Join Waitlist'}
      </button>

      <p className="form-note">
        🔒 We'll never share your information. Unsubscribe anytime.
      </p>
    </form>
  )
}

export default WaitlistForm
