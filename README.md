# Baymax Web App - Agent Orchestration Dashboard

A real-time web dashboard for monitoring and communicating with your AI agent team (Baymax + 5 subagents).

## Features

- **Real-time Agent Tree Visualization** - Interactive tree showing all 6 agents with live status indicators
- **Live Chat Communication** - Send messages to all agents or target specific agents
- **Agent Command Panel** - Send direct commands to individual agents
- **WebSocket Real-time Updates** - Instant status changes, agent responses, and system notifications
- **Dark Theme** - Clean, professional UI matching the Baymax aesthetic

## Agents

| Agent | Role | Color |
|-------|------|-------|
| **Baymax** | Lead Orchestrator & Caretaker | `#00d4aa` |
| **TARS** | Reconnaissance & Documentation | `#ff6b35` |
| **Heisenberg** | Full-Stack Software Engineering | `#7c3aed` |
| **Saul** | Data Wrangling & Automation | `#10b981` |
| **Ryuk** | Academic Writing & LaTeX | `#f59e0b` |
| **Ghost** | Terminal & Environment | `#6366f1` |

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start

# Open http://localhost:3000
```

## Project Structure

```
baymax-web-app/
├── server.js          # Express + WebSocket backend
├── package.json
└── public/
    ├── index.html     # Main dashboard HTML
    ├── styles.css     # Complete styling
    └── app.js         # Frontend application logic
```

## API Endpoints

- `GET /api/agents` - List all agents with status
- `GET /api/agents/:id` - Get specific agent details
- `GET /api/tree` - Get agent tree structure
- `POST /api/agent/:id/command` - Send command to agent

## WebSocket Messages

**Client → Server:**
```json
{ "type": "chat", "text": "message", "target": "all|agentId" }
{ "type": "agent_command", "target": "agentId", "command": "cmd" }
{ "type": "get_agent_tree" }
```

**Server → Client:**
```json
{ "type": "init", "agents": {...} }
{ "type": "agent_status", "agent": "id", "status": "online|busy|thinking" }
{ "type": "chat", "from": "user|agentId", "text": "...", "timestamp": ... }
{ "type": "agent_tree", "tree": {...} }
```

## Deployment

### Local
```bash
npm start
```

### Production (with PM2)
```bash
npm install -g pm2
pm2 start server.js --name baymax-web-app
pm2 save
pm2 startup
```

### Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |

## License

MIT © Muntasir Al Mamun