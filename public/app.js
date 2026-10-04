// Baymax Web App - Frontend Application
class BaymaxApp {
  constructor() {
    this.ws = null;
    this.agents = {};
    this.selectedAgent = null;
    this.messageCount = 0;
    this.startTime = Date.now();
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    
    this.initElements();
    this.bindEvents();
    this.connectWebSocket();
    this.startUptimeCounter();
  }

  initElements() {
    // Panels
    this.agentTree = document.getElementById('agentTree');
    this.chatMessages = document.getElementById('chatMessages');
    this.chatInput = document.getElementById('chatInput');
    this.sendBtn = document.getElementById('sendBtn');
    this.targetAgent = document.getElementById('targetAgent');
    this.agentDetail = document.getElementById('agentDetail');
    this.detailTitle = document.getElementById('detailTitle');
    
    // Status
    this.connectionStatus = document.getElementById('connectionStatus');
    this.statusDot = this.connectionStatus.querySelector('.status-dot');
    this.agentsOnline = document.getElementById('agentsOnline');
    this.messageCountEl = document.getElementById('messageCount');
    this.uptimeEl = document.getElementById('uptime');
    this.wsStatus = document.getElementById('wsStatus');
    
    // Buttons
    this.expandAllBtn = document.getElementById('expandAllBtn');
    this.collapseAllBtn = document.getElementById('collapseAllBtn');
    this.refreshBtn = document.getElementById('refreshBtn');
    this.fullscreenBtn = document.getElementById('fullscreenBtn');
  }

  bindEvents() {
    // Chat
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Agent tree actions
    this.expandAllBtn.addEventListener('click', () => this.toggleAllNodes(true));
    this.collapseAllBtn.addEventListener('click', () => this.toggleAllNodes(false));
    this.refreshBtn.addEventListener('click', () => this.requestAgentTree());
    this.fullscreenBtn.addEventListener('click', () => this.toggleFullscreen());

    // Target agent change
    this.targetAgent.addEventListener('change', () => {
      this.addSystemMessage(`Target changed to: ${this.targetAgent.options[this.targetAgent.selectedIndex].text}`);
    });
  }

  connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.updateConnectionStatus('connecting');
    
    try {
      this.ws = new WebSocket(wsUrl);
      this.ws.binaryType = 'arraybuffer';
      
      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.reconnectAttempts = 0;
        this.updateConnectionStatus('connected');
        this.addSystemMessage('Connected to Baymax Orchestrator');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          this.handleWebSocketMessage(msg);
        } catch (e) {
          console.error('Failed to parse WS message:', e);
        }
      };
      
      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.updateConnectionStatus('disconnected');
        this.addSystemMessage('Disconnected. Attempting to reconnect...');
        this.attemptReconnect();
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (e) {
      console.error('Failed to create WebSocket:', e);
      this.updateConnectionStatus('disconnected');
      this.attemptReconnect();
    }
  }

  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.addSystemMessage('Max reconnection attempts reached. Please refresh the page.');
      return;
    }
    
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    setTimeout(() => this.connectWebSocket(), delay);
  }

  updateConnectionStatus(status) {
    this.statusDot.className = 'status-dot ' + status;
    this.wsStatus.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    this.wsStatus.className = 'value ' + status;
    
    const statusText = this.connectionStatus.querySelector('span:last-child');
    if (statusText) {
      statusText.textContent = status.charAt(0).toUpperCase() + status.slice(1);
    }
  }

  handleWebSocketMessage(msg) {
    switch (msg.type) {
      case 'init':
        this.agents = msg.agents;
        this.renderAgentTree();
        this.updateAgentsOnline();
        break;
      case 'agent_status':
        if (this.agents[msg.agent]) {
          this.agents[msg.agent].status = msg.status;
          this.updateAgentNode(msg.agent, msg.status);
          this.updateAgentDetailIfSelected(msg.agent);
          this.updateAgentsOnline();
        }
        break;
      case 'chat':
        this.displayChatMessage(msg);
        break;
      case 'agent_tree':
        this.renderAgentTreeFromData(msg.tree);
        break;
    }
  }

  sendMessage() {
    const text = this.chatInput.value.trim();
    if (!text) return;
    
    const target = this.targetAgent.value;
    const msg = {
      type: 'chat',
      text: text,
      target: target
    };
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
      this.chatInput.value = '';
    } else {
      this.addSystemMessage('Not connected. Message not sent.');
    }
  }

  displayChatMessage(msg) {
    const div = document.createElement('div');
    div.className = `chat-message ${msg.from === 'user' ? 'user' : 'agent'}`;
    
    const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const avatarChar = msg.from === 'user' ? 'U' : (msg.agentName ? msg.agentName[0] : 'A');
    const avatarColor = msg.agentColor || this.getAgentColor(msg.from);
    
    div.innerHTML = `
      <div class="message-avatar" style="background: ${msg.from === 'user' ? 'var(--accent-primary)' : avatarColor}; color: ${msg.from === 'user' ? 'var(--bg-primary)' : 'white'};">
        ${avatarChar}
      </div>
      <div class="message-content">
        <div class="message-header">
          <span class="message-sender ${msg.from}">${msg.from === 'user' ? 'You' : (msg.agentName || msg.from)}</span>
          <span class="message-time">${time}</span>
        </div>
        <div class="message-text">${this.escapeHtml(msg.text)}</div>
      </div>
    `;
    
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
    this.messageCount++;
    this.messageCountEl.textContent = this.messageCount;
  }

  addSystemMessage(text) {
    const div = document.createElement('div');
    div.className = 'chat-message agent';
    div.style.opacity = '0.7';
    div.style.fontSize = '0.8rem';
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = `
      <div class="message-avatar" style="background: var(--accent-warning);">!</div>
      <div class="message-content">
        <div class="message-text" style="background: transparent; border: none; color: var(--text-muted); font-style: italic;">[${time}] ${this.escapeHtml(text)}</div>
      </div>
    `;
    this.chatMessages.appendChild(div);
    this.chatMessages.scrollTop = this.chatMessages.scrollHeight;
  }

  renderAgentTree() {
    const treeData = this.buildTreeData();
    this.renderAgentTreeFromData(treeData);
  }

  buildTreeData() {
    return {
      name: 'Baymax Orchestrator',
      id: 'baymax',
      role: this.agents.baymax?.role || 'Lead Orchestrator & Caretaker',
      status: this.agents.baymax?.status || 'online',
      color: this.agents.baymax?.color || '#00d4aa',
      children: [
        { name: 'TARS', id: 'tars', role: this.agents.tars?.role || 'Reconnaissance & Documentation', status: this.agents.tars?.status || 'online', color: this.agents.tars?.color || '#ff6b35', children: [] },
        { name: 'Heisenberg', id: 'heisenberg', role: this.agents.heisenberg?.role || 'Full-Stack Software Engineering', status: this.agents.heisenberg?.status || 'online', color: this.agents.heisenberg?.color || '#7c3aed', children: [] },
        { name: 'Saul', id: 'saul', role: this.agents.saul?.role || 'Data Wrangling & Automation', status: this.agents.saul?.status || 'online', color: this.agents.saul?.color || '#10b981', children: [] },
        { name: 'Ryuk', id: 'ryuk', role: this.agents.ryuk?.role || 'Academic Writing & LaTeX', status: this.agents.ryuk?.status || 'online', color: this.agents.ryuk?.color || '#f59e0b', children: [] },
        { name: 'Ghost', id: 'ghost', role: this.agents.ghost?.role || 'Terminal & Environment', status: this.agents.ghost?.status || 'online', color: this.agents.ghost?.color || '#6366f1', children: [] }
      ]
    };
  }

  renderAgentTreeFromData(treeData) {
    this.agentTree.innerHTML = this.renderNode(treeData, 0, true);
    this.attachNodeEvents();
    if (this.selectedAgent) {
      this.highlightSelectedNode(this.selectedAgent);
    }
  }

  renderNode(node, depth, isRoot = false) {
    const hasChildren = node.children && node.children.length > 0;
    const status = node.status || 'online';
    const color = node.color || '#888';
    const indent = depth * 20;
    
    let html = `
      <div class="agent-node" data-agent-id="${node.id}" style="${isRoot ? '' : `margin-left: ${indent}px;`}">
        <div class="agent-node-header" data-agent-id="${node.id}">
    `;
    
    if (hasChildren) {
      html += `<div class="expand-toggle expanded"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></div>`;
    } else {
      html += `<div class="expand-toggle"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"></polyline></svg></div>`;
    }
    
    html += `
          <div class="agent-avatar" style="background: ${color}; color: white;">${node.name[0]}</div>
          <div class="agent-info">
            <div class="agent-name-row">
              <span class="agent-name">${this.escapeHtml(node.name)}</span>
              <span class="agent-status-badge ${status}">${status}</span>
            </div>
            <div class="agent-role">${this.escapeHtml(node.role)}</div>
          </div>
        </div>
    `;
    
    if (hasChildren) {
      html += `<div class="agent-children" data-parent="${node.id}">`;
      node.children.forEach(child => {
        html += this.renderNode(child, depth + 1);
      });
      html += `</div>`;
    }
    
    html += `</div>`;
    return html;
  }

  attachNodeEvents() {
    // Node headers - click to select
    this.agentTree.querySelectorAll('.agent-node-header').forEach(header => {
      header.addEventListener('click', (e) => {
        e.stopPropagation();
        const agentId = header.dataset.agentId;
        this.selectAgent(agentId);
      });
    });
    
    // Expand toggles
    this.agentTree.querySelectorAll('.expand-toggle').forEach(toggle => {
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        const header = toggle.closest('.agent-node-header');
        const node = header.closest('.agent-node');
        const children = node.querySelector('.agent-children');
        if (children) {
          const isCollapsed = children.classList.toggle('collapsed');
          toggle.classList.toggle('expanded', !isCollapsed);
        }
      });
    });
  }

  selectAgent(agentId) {
    this.selectedAgent = agentId;
    this.highlightSelectedNode(agentId);
    this.showAgentDetail(agentId);
    this.detailTitle.textContent = this.agents[agentId]?.name || agentId;
  }

  highlightSelectedNode(agentId) {
    this.agentTree.querySelectorAll('.agent-node-header').forEach(h => h.classList.remove('selected'));
    const selected = this.agentTree.querySelector(`.agent-node-header[data-agent-id="${agentId}"]`);
    if (selected) selected.classList.add('selected');
  }

  showAgentDetail(agentId) {
    const agent = this.agents[agentId];
    if (!agent) return;
    
    const status = agent.status || 'online';
    const quickCommands = [
      'status', 'ping', 'report', 'health', 'logs', 'config'
    ];
    
    this.agentDetail.innerHTML = `
      <div class="agent-detail-card">
        <div class="detail-header">
          <div class="detail-avatar" style="background: ${agent.color}; color: white;">${agent.name[0]}</div>
          <div class="detail-info">
            <div class="detail-name">${this.escapeHtml(agent.name)}</div>
            <div class="detail-role">${this.escapeHtml(agent.role)}</div>
            <span class="detail-status ${status}">${status}</span>
          </div>
        </div>
        <div class="detail-description">${this.escapeHtml(agent.description)}</div>
        <div class="detail-actions">
          <div class="cmd-input-group">
            <input type="text" id="cmdInput" placeholder="Enter command..." data-agent="${agentId}">
            <button class="cmd-btn" onclick="app.sendAgentCommand('${agentId}')">Execute</button>
          </div>
          <div class="quick-commands">
            ${quickCommands.map(cmd => `<button class="quick-cmd" onclick="app.sendQuickCommand('${agentId}', '${cmd}')">${cmd}</button>`).join('')}
          </div>
        </div>
      </div>
    `;
    
    // Bind command input enter key
    const cmdInput = document.getElementById('cmdInput');
    if (cmdInput) {
      cmdInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.sendAgentCommand(agentId);
      });
    }
  }

  updateAgentDetailIfSelected(agentId) {
    if (this.selectedAgent === agentId) {
      this.showAgentDetail(agentId);
    }
  }

  sendAgentCommand(agentId) {
    const input = document.getElementById('cmdInput');
    const command = input?.value?.trim();
    if (!command) return;
    
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'agent_command',
        target: agentId,
        command: command
      }));
      input.value = '';
    }
  }

  sendQuickCommand(agentId, command) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'agent_command',
        target: agentId,
        command: command
      }));
    }
  }

  updateAgentNode(agentId, status) {
    const badge = this.agentTree.querySelector(`.agent-node-header[data-agent-id="${agentId}"] .agent-status-badge`);
    if (badge) {
      badge.className = `agent-status-badge ${status}`;
      badge.textContent = status;
    }
    this.updateAgentsOnline();
  }

  updateAgentsOnline() {
    const online = Object.values(this.agents).filter(a => a.status === 'online').length;
    const total = Object.keys(this.agents).length;
    this.agentsOnline.textContent = `${online}/${total}`;
  }

  toggleAllNodes(expand) {
    this.agentTree.querySelectorAll('.agent-children').forEach(children => {
      children.classList.toggle('collapsed', !expand);
    });
    this.agentTree.querySelectorAll('.expand-toggle').forEach(toggle => {
      toggle.classList.toggle('expanded', expand);
    });
  }

  requestAgentTree() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: 'get_agent_tree' }));
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  startUptimeCounter() {
    setInterval(() => {
      const elapsed = Date.now() - this.startTime;
      const hrs = Math.floor(elapsed / 3600000).toString().padStart(2, '0');
      const mins = Math.floor((elapsed % 3600000) / 60000).toString().padStart(2, '0');
      const secs = Math.floor((elapsed % 60000) / 1000).toString().padStart(2, '0');
      this.uptimeEl.textContent = `${hrs}:${mins}:${secs}`;
    }, 1000);
  }

  getAgentColor(agentId) {
    const colors = {
      baymax: '#00d4aa',
      tars: '#ff6b35',
      heisenberg: '#7c3aed',
      saul: '#10b981',
      ryuk: '#f59e0b',
      ghost: '#6366f1'
    };
    return colors[agentId] || '#888';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize app when DOM is ready
let app;
document.addEventListener('DOMContentLoaded', () => {
  app = new BaymaxApp();
  window.app = app; // Expose for onclick handlers
});