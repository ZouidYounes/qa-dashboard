import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [suites, setSuites] = useState([]);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSuites();
  }, []);

  const fetchSuites = async () => {
    try {
      const response = await axios.get('/api/tests/suites');
      setSuites(response.data || []);
    } catch (err) {
      setError('Failed to fetch test suites: ' + err.message);
    }
  };

  const fetchTestCases = async (suiteId) => {
    try {
      const response = await axios.get(`/api/tests/suites/${suiteId}/cases`);
      setTestCases(response.data || []);
      setSelectedSuite(suiteId);
      
      // Load results for all test cases
      response.data.forEach(testCase => {
        fetchResults(testCase.id);
      });
    } catch (err) {
      setError('Failed to fetch test cases: ' + err.message);
    }
  };

  const fetchResults = async (caseId) => {
    try {
      const response = await axios.get(`/api/results/cases/${caseId}`);
      setResults(prev => ({
        ...prev,
        [caseId]: response.data || []
      }));
    } catch (err) {
      console.error('Error fetching results:', err);
    }
  };

  const runTest = async (testCase) => {
    setLoading(prev => ({ ...prev, [testCase.id]: true }));
    try {
      const response = await axios.post('/api/tests/run', { testCaseId: testCase.id });
      await fetchResults(testCase.id);
    } catch (err) {
      setError('Error running test: ' + err.message);
    } finally {
      setLoading(prev => ({ ...prev, [testCase.id]: false }));
    }
  };

  const getLatestResult = (caseId) => {
    const caseResults = results[caseId];
    if (!caseResults || caseResults.length === 0) return null;
    return caseResults[0];
  };

  return (
    <div className="container">
      <h1>🎹 QA Dashboard - Piano Event Testing</h1>
      
      {error && <div className="error-banner">{error}</div>}
      
      <div className="layout">
        <aside className="sidebar">
          <h2>Test Suites</h2>
          <div className="suite-list">
            {suites.length === 0 ? (
              <p className="empty-state">No test suites yet</p>
            ) : (
              suites.map(suite => (
                <div
                  key={suite.id}
                  className={`suite-item ${selectedSuite === suite.id ? 'active' : ''}`}
                  onClick={() => fetchTestCases(suite.id)}
                >
                  <div className="suite-name">{suite.name}</div>
                  <div className="suite-desc">{suite.description}</div>
                </div>
              ))
            )}
          </div>
        </aside>

        <main className="content">
          {selectedSuite ? (
            <>
              <h2>Test Cases</h2>
              <div className="test-cases">
                {testCases.length === 0 ? (
                  <p className="empty-state">No test cases in this suite</p>
                ) : (
                  testCases.map(testCase => {
                    const latestResult = getLatestResult(testCase.id);
                    const resultStatus = latestResult?.status;
                    
                    return (
                      <div key={testCase.id} className={`test-case-card ${resultStatus ? resultStatus : ''}`}>
                        <div className="test-header">
                          <div className="title-group">
                            <h3>{testCase.name}</h3>
                            {latestResult && (
                              <span className={`status-pill ${resultStatus}`}>
                                {resultStatus.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={() => runTest(testCase)}
                            disabled={loading[testCase.id]}
                            className="run-button"
                          >
                            {loading[testCase.id] ? 'Running...' : 'Run Test'}
                          </button>
                        </div>
                        <div className="test-url">{testCase.url}</div>
                        
                        <details className="expected-events">
                          <summary>Expected Events ({testCase.expected_events?.length || 0})</summary>
                          <pre>{JSON.stringify(testCase.expected_events || [], null, 2)}</pre>
                        </details>
                        
                        {results[testCase.id] && results[testCase.id].length > 0 && (
                          <div className="results">
                            <h4>Results History</h4>
                            {results[testCase.id].slice(0, 10).map((result, idx) => (
                              <div key={result.id} className={`result-item ${result.status}`}>
                                <div className="result-meta">
                                  <div className="status-badge">{result.status.toUpperCase()}</div>
                                  <div className="duration">{result.duration_ms}ms</div>
                                  <div className="timestamp">{new Date(result.run_at).toLocaleString()}</div>
                                </div>
                                
                                {result.captured_events && result.captured_events.length > 0 && (
                                  <details>
                                    <summary>Captured Events ({result.captured_events.length})</summary>
                                    <pre>{JSON.stringify(result.captured_events, null, 2)}</pre>
                                  </details>
                                )}
                                
                                {result.errors && result.errors.length > 0 && (
                                  <details className="errors-section\">
                                    <summary>Validation Errors</summary>
                                    <pre>{JSON.stringify(result.errors, null, 2)}</pre>
                                  </details>
                                )}
                              </div>
                            ))}\n                          </div>\n                        )}\n                      </div>\n                    );\n                  })\n                )}\n              </div>\n            </>\n          ) : (\n            <div className=\"empty-state-main\">\n              <p>Select a test suite to get started</p>\n            </div>\n          )}\n        </main>\n      </div>\n    </div>\n  );\n}\n\nexport default App;\n