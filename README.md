# Baymax Web App - Agent Orchestration Dashboard

A real-time web dashboard for monitoring and communicating with your AI agent team (Baymax + 5 subagents).

## 🌐 Live Demo

**[https://baymax-web-app.vercel.app](https://baymax-web-app.vercel.app)** ← *Deployed on Vercel*

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
├── railway.json       # Railway deployment config
├── render.yaml        # Render deployment config
├── vercel.json        # Vercel deployment config
├── Dockerfile         # Docker deployment
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

### One-Click Deploy

| Platform | Config | Deploy |
|----------|--------|--------|
| **Vercel** | `vercel.json` | [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Muntasir-Mamun7/baymax-web-app) |
| **Railway** | `railway.json` | [![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Muntasir-Mamun7/baymax-web-app) |
| **Render** | `render.yaml` | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/Muntasir-Mamun7/baymax-web-app) |

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
```bash
docker build -t baymax-web-app .
docker run -p 3000:3000 baymax-web-app
```

Or use the included `Dockerfile`.

### Docker Compose
```yaml
version: '3.8'
services:
  baymax-web-app:
    build: .
    ports:
      - "3000:3000"
    restart: unless-stopped
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

## License

MIT © Muntasir Al Mamun
