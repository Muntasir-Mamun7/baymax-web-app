// Vercel serverless function entry point
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

// We need to adapt the server for serverless - WebSockets don't work on Vercel
// This will serve the static files and REST API only
// For full WebSocket support, use Railway, Render, or a VPS

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Agent registry - simulating the 5 subagents
const agents = {
  'baymax': { name: 'Baymax', role: 'Lead Orchestrator & Caretaker', status: 'online', color: '#00d4aa', description: 'Manages all subagents, answers directly to Muntasir (Morn)' },
  'tars': { name: 'TARS', role: 'Reconnaissance & Documentation', status: 'online', color: '#ff6b35', description: 'Web search, documentation scraping, recon missions' },
  'heisenberg': { name: 'Heisenberg', role: 'Full-Stack Software Engineering', status: 'online', color: '#7c3aed', description: 'Desktop apps, web platforms, architecture' },
  'saul': { name: 'Saul', role: 'Data Wrangling & Automation', status: 'online', color: '#10b981', description: 'Excel/Word automation, financial analysis, stats' },
  'ryuk': { name: 'Ryuk', role: 'Academic Writing & LaTeX', status: 'online', color: '#f59e0b', description: 'Thesis sections, publication-grade prose' },
  'ghost': { name: 'Ghost', role: 'Terminal & Environment', status: 'online', color: '#6366f1', description: 'Command execution, test running, env checks' }
};

// REST API endpoints
app.get('/api/agents', (req, res) => {
  res.json(agents);
});

app.get('/api/agents/:id', (req, res) => {
  if (agents[req.params.id]) {
    res.json(agents[req.params.id]);
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

app.get('/api/tree', (req, res) => {
  res.json(buildAgentTree());
});

app.post('/api/agent/:id/command', (req, res) => {
  const { id } = req.params;
  const { command } = req.body;
  if (agents[id]) {
    res.json({ success: true, agent: id, command, note: 'WebSocket not available on Vercel - use Railway/Render for real-time' });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

function buildAgentTree() {
  return {
    name: 'Baymax Orchestrator',
    id: 'baymax',
    role: agents.baymax.role,
    status: agents.baymax.status,
    color: agents.baymax.color,
    children: [
      { name: 'TARS', id: 'tars', role: agents.tars.role, status: agents.tars.status, color: agents.tars.color, children: [] },
      { name: 'Heisenberg', id: 'heisenberg', role: agents.heisenberg.role, status: agents.heisenberg.status, color: agents.heisenberg.color, children: [] },
      { name: 'Saul', id: 'saul', role: agents.saul.role, status: agents.saul.status, color: agents.saul.color, children: [] },
      { name: 'Ryuk', id: 'ryuk', role: agents.ryuk.role, status: agents.ryuk.status, color: agents.ryuk.color, children: [] },
      { name: 'Ghost', id: 'ghost', role: agents.ghost.role, status: agents.ghost.status, color: agents.ghost.color, children: [] }
    ]
  };
}

module.exports = app;