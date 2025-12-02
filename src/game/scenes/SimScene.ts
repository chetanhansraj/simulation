import Phaser from 'phaser';
import { Agent, Company, LocationType } from '../../types';
import { WORLD_LOCATIONS, COMPANY_HQS, AGENT_COLORS } from '../config';

export class SimScene extends Phaser.Scene {
  declare add: Phaser.GameObjects.GameObjectFactory;
  declare make: Phaser.GameObjects.GameObjectCreator;

  private agents: Map<string, Phaser.GameObjects.Container> = new Map();
  private companies: Map<string, Phaser.GameObjects.Container> = new Map();
  private agentData: Agent[] = [];
  private companyData: Company[] = [];

  constructor() {
    super('SimScene');
  }

  preload() {
    // --- PROCEDURAL ASSET GENERATION ---
    // Since we don't have PNGs yet, we draw them programmatically to look like pixel art.
    
    // 1. Generate Ground Tile
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x1e293b); // Darker slate
    graphics.fillRect(0, 0, 32, 32);
    graphics.generateTexture('ground', 32, 32);

    // 2. Generate Building Base
    graphics.clear();
    graphics.fillStyle(0xffffff);
    graphics.fillRect(0, 0, 64, 64);
    graphics.lineStyle(2, 0x000000);
    graphics.strokeRect(0, 0, 64, 64);
    graphics.generateTexture('building_base', 64, 64);

    // 3. Generate Agent Base (Pixel Person)
    graphics.clear();
    graphics.fillStyle(0xffffff);
    // Body
    graphics.fillRect(8, 12, 16, 20);
    // Head
    graphics.fillRect(8, 0, 16, 12);
    // Legs (Idle)
    graphics.fillRect(8, 32, 6, 8);
    graphics.fillRect(18, 32, 6, 8);
    graphics.generateTexture('agent_base', 32, 40);
  }

  create() {
    // 1. Background
    this.add.tileSprite(600, 400, 1200, 800, 'ground').setAlpha(0.5);

    // 2. Draw Locations (Buildings)
    Object.entries(WORLD_LOCATIONS).forEach(([key, loc]) => {
      const container = this.add.container(loc.x, loc.y);
      
      // Building Sprite
      const sprite = this.add.sprite(0, 0, 'building_base').setTint(loc.color).setScale(1.5);
      
      // Label
      const text = this.add.text(0, 50, loc.label, {
        fontFamily: 'monospace',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setPadding(4);

      // Icon/Emoji
      const icon = this.add.text(0, 0, this.getLocationEmoji(key as LocationType), { fontSize: '32px' }).setOrigin(0.5);

      container.add([sprite, icon, text]);
    });

    // 3. Draw Company HQs
    COMPANY_HQS.forEach((hq) => {
      const container = this.add.container(hq.x, hq.y);
      
      // HQ Building (Larger)
      const sprite = this.add.sprite(0, 0, 'building_base').setTint(hq.color).setScale(2);
      
      const label = this.add.text(0, 70, hq.label, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setPadding(4);

      // Funds Display
      const fundsText = this.add.text(0, -50, '$0', {
        fontFamily: 'monospace',
        fontSize: '12px',
        color: '#22c55e',
        backgroundColor: '#000000'
      }).setOrigin(0.5).setPadding(2);
      fundsText.setName('funds'); // Tag for update

      container.add([sprite, label, fundsText]);
      this.companies.set(hq.id, container);
    });
  }

  update(time: number, delta: number) {
    // Smoothly interpolate agents to their target locations
    this.agents.forEach((container, agentId) => {
      const agent = this.agentData.find(a => a.id === agentId);
      if (!agent) return;

      // Determine Target Coordinates
      const targetLoc = WORLD_LOCATIONS[agent.location];
      if (!targetLoc) return;

      // Add some random scatter so they don't stack perfectly
      // We use the agent ID to make the scatter deterministic but unique
      const scatterX = (parseInt(agent.id) * 17) % 60 - 30;
      const scatterY = (parseInt(agent.id) * 23) % 60 - 30;
      
      const tx = targetLoc.x + scatterX;
      const ty = targetLoc.y + scatterY;

      // Move towards target (Simple lerp)
      const distance = Phaser.Math.Distance.Between(container.x, container.y, tx, ty);
      
      if (distance > 4) {
        // Move
        const speed = 0.05 * delta; // Speed factor
        const angle = Phaser.Math.Angle.Between(container.x, container.y, tx, ty);
        const velX = Math.cos(angle) * speed;
        const velY = Math.sin(angle) * speed;
        
        container.x += velX;
        container.y += velY;

        // "Bobbing" animation while walking
        container.y += Math.sin(time / 100) * 0.5;
        
        // Flip sprite based on direction
        const sprite = container.getAt(0) as Phaser.GameObjects.Sprite;
        if (velX < 0) sprite.setFlipX(true);
        else sprite.setFlipX(false);
      }
    });

    // Pulse Company HQs if funds increase (Visual effect logic would go here)
  }

  // --- PUBLIC METHODS CALLED FROM REACT ---

  public updateAgents(agents: Agent[]) {
    this.agentData = agents;
    
    // Create new sprites for new agents
    agents.forEach(agent => {
        // Check spawn time logic from React is handled there, but we double check existence
        if (!this.agents.has(agent.id)) {
            this.createAgentSprite(agent);
        } else {
            // Update existing agent UI
            const container = this.agents.get(agent.id)!;
            
            // Update Action Bubble
            const actionText = container.getByName('action') as Phaser.GameObjects.Text;
            if (agent.lastDecision?.action) {
                actionText.setText(this.getActionEmoji(agent.lastDecision.action));
                actionText.setVisible(true);
            } else {
                actionText.setVisible(false);
            }

            // Update Name color based on health
            const nameText = container.getByName('name') as Phaser.GameObjects.Text;
            if (agent.vitals.hunger > 80) nameText.setColor('#ef4444');
            else nameText.setColor('#ffffff');
        }
    });
  }

  public updateCompanies(companies: Company[]) {
      this.companyData = companies;
      companies.forEach(comp => {
          const container = this.companies.get(comp.id);
          if (container) {
              const fundsText = container.getByName('funds') as Phaser.GameObjects.Text;
              fundsText.setText(`$${comp.funds.toFixed(0)}`);
          }
      });
  }

  private createAgentSprite(agent: Agent) {
      // Start them at home
      const startLoc = WORLD_LOCATIONS[LocationType.HOME];
      const container = this.add.container(startLoc.x, startLoc.y);

      // Sprite
      const color = AGENT_COLORS[agent.personality.type] || 0xffffff;
      const sprite = this.add.sprite(0, 0, 'agent_base').setTint(color);

      // Name Tag
      const nameTag = this.add.text(0, 25, agent.name, {
          fontSize: '10px',
          color: '#ffffff',
          backgroundColor: '#00000088'
      }).setOrigin(0.5).setPadding(2);
      nameTag.setName('name');

      // Action Bubble (Initially Hidden)
      const actionBubble = this.add.text(0, -30, '', { fontSize: '20px' }).setOrigin(0.5);
      actionBubble.setName('action');

      container.add([sprite, nameTag, actionBubble]);
      this.agents.set(agent.id, container);
  }

  private getLocationEmoji(type: LocationType): string {
      switch (type) {
          case LocationType.HOME: return '🏠';
          case LocationType.WORK: return '🏢';
          case LocationType.STORE: return '🛒';
          case LocationType.PARK: return '🌳';
          default: return '📍';
      }
  }

  private getActionEmoji(action: string): string {
      switch (action) {
          case 'WORK': return '💼';
          case 'BUY': return '🛍️';
          case 'CONSUME': return '🍔';
          case 'SLEEP': return '💤';
          case 'SOCIALIZE': return '👋';
          case 'MOVE': return '👟';
          case 'USE': return '🎮';
          default: return '';
      }
  }
}