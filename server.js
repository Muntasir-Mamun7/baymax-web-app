const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Agent registry - simulating the 5 subagents
const agents = {
  'baymax': { name: 'Baymax', role: 'Lead Orchestrator & Caretaker', status: 'online', color: '#00d4aa', description: 'Manages all subagents, answers directly to Muntasir (Morn)' },
  'tars': { name: 'TARS', role: 'Reconnaissance & Documentation', status: 'online', color: '#ff6b35', description: 'Web search, documentation scraping, recon missions' },
  'heisenberg': { name: 'Heisenberg', role: 'Full-Stack Software Engineering', status: 'online', color: '#7c3aed', description: 'Desktop apps, web platforms, architecture' },
  'saul': { name: 'Saul', role: 'Data Wrangling & Automation', status: 'online', color: '#10b981', description: 'Excel/Word automation, financial analysis, stats' },
  'ryuk': { name: 'Ryuk', role: 'Academic Writing & LaTeX', status: 'online', color: '#f59e0b', description: 'Thesis sections, publication-grade prose' },
  'ghost': { name: 'Ghost', role: 'Terminal & Environment', status: 'online', color: '#6366f1', description: 'Command execution, test running, env checks' }
};

// WebSocket connections
const clients = new Set();

function broadcast(message) {
  const data = JSON.stringify(message);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
}

// Simulate agent activity
function simulateAgentActivity() {
  const agentIds = Object.keys(agents);
  const randomAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
  const statuses = ['online', 'busy', 'thinking'];
  agents[randomAgent].status = statuses[Math.floor(Math.random() * statuses.length)];
  broadcast({ type: 'agent_status', agent: randomAgent, status: agents[randomAgent].status });
}

// Heartbeat
setInterval(simulateAgentActivity, 5000);

wss.on('connection', (ws) => {
  clients.add(ws);
  console.log('Client connected. Total:', clients.size);

  // Send initial state
  ws.send(JSON.stringify({ type: 'init', agents }));

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      handleMessage(ws, msg);
    } catch (e) {
      console.error('Invalid message:', e);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('Client disconnected. Total:', clients.size);
  });
});

function handleMessage(ws, msg) {
  switch (msg.type) {
    case 'chat':
      // Broadcast user message to all clients
      broadcast({ type: 'chat', from: 'user', text: msg.text, timestamp: Date.now() });
      
      // Simulate agent responses
      setTimeout(() => {
        const agentIds = Object.keys(agents);
        const respondingAgent = agentIds[Math.floor(Math.random() * agentIds.length)];
        const responses = [
          `Understood. ${agents[respondingAgent].name} (${agents[respondingAgent].role}) is on it.`,
          `Processing your request through ${agents[respondingAgent].name}...`,
          `${agents[respondingAgent].name} here. ${agents[respondingAgent].description}`,
          `Task delegated to ${agents[respondingAgent].name}. ETA: 2-3 seconds.`
        ];
        broadcast({
          type: 'chat',
          from: respondingAgent,
          agentName: agents[respondingAgent].name,
          agentColor: agents[respondingAgent].color,
          text: responses[Math.floor(Math.random() * responses.length)],
          timestamp: Date.now()
        });
      }, 1000);
      break;

    case 'get_agent_tree':
      ws.send(JSON.stringify({ type: 'agent_tree', tree: buildAgentTree() }));
      break;

    case 'agent_command':
      // Handle direct agent commands
      if (agents[msg.target]) {
        agents[msg.target].status = 'busy';
        broadcast({ type: 'agent_status', agent: msg.target, status: 'busy' });
        setTimeout(() => {
          agents[msg.target].status = 'online';
          broadcast({ type: 'agent_status', agent: msg.target, status: 'online' });
          broadcast({
            type: 'chat',
            from: msg.target,
            agentName: agents[msg.target].name,
            agentColor: agents[msg.target].color,
            text: `Command executed: ${msg.command}. Result: Success.`,
            timestamp: Date.now()
          });
        }, 1500);
      }
      break;
  }
}

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
    agents[id].status = 'busy';
    broadcast({ type: 'agent_status', agent: id, status: 'busy' });
    setTimeout(() => {
      agents[id].status = 'online';
      broadcast({ type: 'agent_status', agent: id, status: 'online' });
    }, 1500);
    res.json({ success: true, agent: id, command });
  } else {
    res.status(404).json({ error: 'Agent not found' });
  }
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Baymax Web App running on http://localhost:${PORT}`);
  console.log('WebSocket server ready for real-time communication');
});