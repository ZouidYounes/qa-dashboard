import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

function App() {
  const [suites, setSuites] = useState([]);
  const [selectedSuite, setSelectedSuite] = useState(null);
  const [testCases, setTestCases] = useState([]);
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSuites();
  }, []);

  const fetchSuites = async () => {
    try {
      const response = await axios.get('/api/tests/suites');
      setSuites(response.data);
    } catch (error) {
      console.error('Error fetching suites:', error);
    }
  };

  const fetchTestCases = async (suiteId) => {
    try {
      const response = await axios.get(`/api/tests/suites/${suiteId}/cases`);
      setTestCases(response.data);
      setSelectedSuite(suiteId);
    } catch (error) {
      console.error('Error fetching test cases:', error);
    }
  };

  const fetchResults = async (caseId) => {
    try {
      const response = await axios.get(`/api/results/cases/${caseId}`);
      setResults(prev => ({
        ...prev,
        [caseId]: response.data
      }));
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  const runTest = async (testCase) => {
    setLoading(true);
    try {
      const response = await axios.post('/api/tests/run', { testCaseId: testCase.id });
      await fetchResults(testCase.id);
    } catch (error) {
      console.error('Error running test:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>QA Dashboard - Piano Event Testing</h1>
      
      <div className="layout">
        <aside className="sidebar">
          <h2>Test Suites</h2>
          {suites.map(suite => (
            <div
              key={suite.id}
              className={`suite-item ${selectedSuite === suite.id ? 'active' : ''}`}
              onClick={() => fetchTestCases(suite.id)}
            >
              <div className="suite-name">{suite.name}</div>
              <div className="suite-desc">{suite.description}</div>
            </div>
          ))}
        </aside>

        <main className="content">
          {selectedSuite && (
            <>
              <h2>Test Cases</h2>
              <div className="test-cases">
                {testCases.map(testCase => (
                  <div key={testCase.id} className="test-case-card">
                    <div className="test-header">
                      <h3>{testCase.name}</h3>
                      <button
                        onClick={() => runTest(testCase)}
                        disabled={loading}
                        className="run-button"
                      >
                        Run Test
                      </button>
                    </div>
                    <div className="test-url">{testCase.url}</div>
                    
                    {results[testCase.id] && (
                      <div className="results">
                        <h4>Results</h4>
                        {results[testCase.id].map(result => (
                          <div key={result.id} className={`result-item ${result.status}`}>
                            <div className="status-badge">{result.status.toUpperCase()}</div>
                            <div className="duration">{result.duration_ms}ms</div>
                            <div className="timestamp">{new Date(result.run_at).toLocaleString()}</div>
                            {result.captured_events && (
                              <details>
                                <summary>Events ({result.captured_events.length})</summary>
                                <pre>{JSON.stringify(result.captured_events, null, 2)}</pre>
                              </details>
                            )}
                            {result.errors && result.errors.length > 0 && (
                              <details>
                                <summary>Errors</summary>
                                <pre>{JSON.stringify(result.errors, null, 2)}</pre>
                              </details>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
