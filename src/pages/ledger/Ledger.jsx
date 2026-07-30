import React, { useState, useEffect } from 'react';

const Ledger = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Fetch ledger records from the flywheel API
    fetch('http://localhost:9094/keystone/decision-ledger')
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setRecords(data.result || []);
        } else {
          setError('Failed to load ledger');
        }
      })
      .catch(err => {
        setError('Ledger API unavailable');
        console.error('Ledger fetch error:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-container">
      <h1>Refutation Ledger</h1>
      <p className="subtitle">
        The asset Law 4 exists to protect. Append-only, never deleted.
      </p>

      {loading && <p>Loading ledger records...</p>}
      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <div className="ledger-info">
          <h2>Design Laws</h2>
          <ul>
            <li><strong>Law 1:</strong> Every claim must be recomputable from an artefact</li>
            <li><strong>Law 2:</strong> No lens may borrow another lens's credibility</li>
            <li><strong>Law 3:</strong> Three outcomes, never two (SURVIVED / DESTROYED / UNMEASURED)</li>
            <li><strong>Law 4:</strong> Hedges propagate — a tag may never be dropped or upgraded silently</li>
          </ul>

          <h2>Ledger Properties</h2>
          <ul>
            <li>Records are append-only — wrong records stay with <code>superseded_by</code> set</li>
            <li><code>n &lt; 20</code> forces <code>lower_bound: true</code> structurally</li>
            <li>Contradiction is surfaced, never resolved automatically</li>
            <li>Only operations: append, get, current, history, contested, by_tag, stale_leads</li>
          </ul>

          <h2>API Endpoints</h2>
          <table>
            <thead>
              <tr>
                <th>Method</th>
                <th>Endpoint</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>GET</td><td>/keystone/decision-ledger</td><td>List all records</td></tr>
              <tr><td>POST</td><td>/keystone/decision-ledger</td><td>Append new record</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/:id</td><td>Show record</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/:id/current</td><td>Current version</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/:id/history</td><td>Full history</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/contested</td><td>Contested records</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/stale</td><td>Stale leads</td></tr>
              <tr><td>GET</td><td>/keystone/decision-ledger/tag/:tag</td><td>By tag</td></tr>
            </tbody>
          </table>

          <p className="note">
            This ledger is the moat. It records the history of being wrong.
          </p>
        </div>
      )}
    </div>
  );
};

export default Ledger;
