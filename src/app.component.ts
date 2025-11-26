
import { Component, ChangeDetectionStrategy, ElementRef, viewChild, AfterViewInit, signal } from '@angular/core';
import * as d3 from 'd3';

interface DiagramNode {
  id: string;
  subtitle?: string;
  x: number;
  y: number;
  group: 'red' | 'orange' | 'green' | 'black' | 'blue';
  shape: 'hexagon' | 'icon' | 'db' | 'zabbix';
  description: string;
  docUrl?: string;
}

interface DiagramLink {
  source: string;
  target: string;
  label?: string;
  labelPos?: { x: number, y: number };
  waypoints?: { x: number, y: number }[];
  curve?: 'basis' | 'default';
}

interface ArchLayer {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  labelPos: 'top' | 'left';
}


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:resize)': 'onResize()'
  }
})
export class AppComponent implements AfterViewInit {
  private svgContainer = viewChild.required<ElementRef<SVGElement>>('svgContainer');
  // FIX: Corrected typo from `viewchild` to `viewChild`.
  private tooltip = viewChild.required<ElementRef<HTMLDivElement>>('tooltip');

  selectedNode = signal<DiagramNode | null>(null);

  private nodes: DiagramNode[] = [
    // External Tier
    { id: 'Corretoras', x: 100, y: 50, group: 'black', shape: 'hexagon', description: 'Integração com corretoras via protocolos SINACOR, FIX e APIs REST para envio de ordens e recebimento de dados.', docUrl: '#/docs/corretoras' },
    { id: 'B3', x: 250, y: 50, group: 'black', shape: 'hexagon', description: 'Conexão direta com a B3 para envio de ordens via FIX e recebimento de dados de mercado.', docUrl: '#/docs/b3' },
    { id: 'Bolsas Internacionais', x: 650, y: 50, group: 'black', shape: 'hexagon', description: 'Conexão com bolsas internacionais para obtenção de dados de mercado e cotações.', docUrl: '#/docs/bolsas-internacionais' },
    
    // Roteamento & Core Tier
    { id: 'WalletPosition', x: 250, y: 200, group: 'red', shape: 'hexagon', description: 'Serviço responsável por consultar e manter a posição e custódia das carteiras dos clientes.', docUrl: '#/docs/wallet-position' },
    { id: 'BackOffice', x: 100, y: 350, group: 'red', shape: 'hexagon', description: 'Sistema de BackOffice que gerencia dados de saldo, custódia e conciliação de ordens.', docUrl: '#/docs/backoffice' },
    { id: 'Hades', x: 250, y: 350, group: 'red', shape: 'hexagon', description: 'Core do sistema de roteamento de ordens (OMS). Gerencia o ciclo de vida completo das ordens.', docUrl: '#/docs/hades' },
    { id: 'Ares', x: 400, y: 200, group: 'red', shape: 'hexagon', description: 'Serviço especializado em ordens complexas e estratégias, como ordens OCO (Order Cancels Order).', docUrl: '#/docs/ares' },
    { id: 'Caronte', x: 400, y: 280, group: 'red', shape: 'hexagon', description: 'Gerencia lógicas de operações estruturadas como opções e Long&Short.', docUrl: '#/docs/caronte' },
    { id: 'CopyInvest', x: 400, y: 430, group: 'red', shape: 'hexagon', description: 'Plataforma de "social trading" que permite que usuários copiem as operações de traders experientes.', docUrl: '#/docs/copy-invest' },

    // Access Layer (Proxies)
    { id: 'HadesProxy', x: 250, y: 600, group: 'red', shape: 'hexagon', description: 'Proxy de acesso para o Hades, otimizando e sécurizando a comunicação para clientes.', docUrl: '#/docs/hades-proxy' },
    { id: 'MercuryProxy', x: 500, y: 600, group: 'orange', shape: 'hexagon', description: 'Proxy para distribuição de Market Data para os clientes.', docUrl: '#/docs/mercury-proxy' },
    { id: 'VenusProxy', x: 700, y: 600, group: 'orange', shape: 'hexagon', description: 'Proxy para dados de perfil, configurações e layouts dos usuários.', docUrl: '#/docs/venus-proxy' },
    { id: 'InfoProxy', x: 950, y: 520, group: 'green', shape: 'hexagon', description: 'Proxy para distribuição de notícias e dados informativos.', docUrl: '#/docs/info-proxy' },

    // Internal Systems & Market Data
    { id: 'AuthAPIGateway', x: 650, y: 170, group: 'orange', shape: 'hexagon', description: 'Gateway de API central que lida com a autenticação e autorização de todas as requisições internas e externas.', docUrl: '#/docs/auth-api-gateway' },
    { id: 'Apollo', x: 600, y: 350, group: 'orange', shape: 'hexagon', description: 'Sistema interno para gerenciamento e orquestração de serviços.', docUrl: '#/docs/apollo' },
    { id: 'Atlas', x: 700, y: 350, group: 'orange', shape: 'hexagon', description: 'Serviço de Service Discovery, permitindo que serviços se encontrem dinamicamente na rede.', docUrl: '#/docs/atlas' },
    { id: 'Minerva', x: 800, y: 170, group: 'orange', shape: 'hexagon', description: 'Serviço de ingestão e processamento de dados de mercado (cotações) de bolsas internacionais.', docUrl: '#/docs/minerva' },
    { id: 'Athena', x: 900, y: 300, group: 'orange', shape: 'hexagon', description: 'Fornece dados de calendário econômico, relatórios e eventos corporativos.', docUrl: '#/docs/athena' },
    { id: 'Profile', x: 800, y: 350, group: 'orange', shape: 'hexagon', description: 'Gerencia perfis de usuário, configurações de plataforma e preferências.', docUrl: '#/docs/profile' },
    
    // Monitoring & Logging Layer
    { id: 'Nasdaq Gateway', x: 1050, y: 170, group: 'orange', shape: 'hexagon', description: 'Gateway específico para conexão com o feed de dados da Nasdaq.', docUrl: '#/docs/nasdaq-gateway' },
    { id: 'Replay Dual', x: 1050, y: 280, group: 'orange', shape: 'hexagon', description: 'Serviço que grava e permite o replay de dados de mercado para testes e simulações.', docUrl: '#/docs/replay-dual' },
    { id: 'Hermes', x: 1050, y: 390, group: 'orange', shape: 'hexagon', description: 'Processa e distribui notícias e eventos de mercado em tempo real.', docUrl: '#/docs/hermes' },
    { id: 'InstrumentationService', x: 1300, y: 170, group: 'green', shape: 'hexagon', description: 'Coleta e expõe métricas de saúde e performance dos microsserviços.', docUrl: '#/docs/instrumentation-service' },
    { id: 'InstrumentationProxy', x: 1300, y: 350, group: 'green', shape: 'hexagon', description: 'Proxy que agrega logs de diversos serviços antes de enviá-los para o sistema de armazenamento.', docUrl: '#/docs/instrumentation-proxy' },
    { id: 'LogAPI', x: 1150, y: 520, group: 'green', shape: 'hexagon', description: 'API para consulta e gerenciamento de logs centralizados.', docUrl: '#/docs/log-api' },
    { id: 'Zabbix', x: 1500, y: 170, group: 'green', shape: 'zabbix', description: 'Ferramenta externa de monitoramento (Zabbix) que consome as métricas do InstrumentationService.', docUrl: '#/docs/zabbix' },
    { id: 'WDI', subtitle: '(NOC Tools)', x: 1500, y: 350, group: 'green', shape: 'db', description: 'Armazenamento central de logs (WDI) e ferramentas de NOC (Network Operations Center).', docUrl: '#/docs/wdi' },

    // Client Tier
    { id: 'Profit Desktop', x: 250, y: 750, group: 'blue', shape: 'icon', description: 'Aplicação cliente para desktop.', docUrl: '#/docs/profit-desktop' },
    { id: 'Profit Mobile', x: 500, y: 750, group: 'blue', shape: 'icon', description: 'Aplicação cliente para dispositivos móveis.', docUrl: '#/docs/profit-mobile' },
    { id: 'HomeBrokers', subtitle: '(Web)', x: 700, y: 750, group: 'blue', shape: 'icon', description: 'Plataforma web de HomeBroker para clientes.', docUrl: '#/docs/homebrokers' },
  ];

  private links: DiagramLink[] = [
    // Externals to Roteamento
    { source: 'Corretoras', target: 'BackOffice', label: 'SINACOR\nFIX\nREST API', labelPos: { x: -80, y: 0 } },
    { source: 'B3', target: 'WalletPosition', label: 'FIX' },
    { source: 'B3', target: 'Hades', label: 'FIX' },
    // Roteamento internal
    { source: 'BackOffice', target: 'Hades', label: 'Ordens' },
    { source: 'Hades', target: 'WalletPosition' },
    { source: 'Hades', target: 'Ares', label: 'Ordens' },
    { source: 'Hades', target: 'Caronte', label: 'Ordens' },
    { source: 'Ares', target: 'Caronte' },
    { source: 'Hades', target: 'CopyInvest', label: 'Ordens' },
    // Roteamento to Access Layer
    { source: 'Hades', target: 'HadesProxy', label: 'Ordens', waypoints: [{x: 250, y: 450}] },
    { source: 'BackOffice', target: 'HadesProxy' },
    { source: 'HadesProxy', target: 'Profit Desktop', label: 'Routing' },
    // External to Market Data
    { source: 'Bolsas Internacionais', target: 'Minerva', label: 'Data' },
    // Auth Gateway
    { source: 'Minerva', target: 'AuthAPIGateway' },
    { source: 'Apollo', target: 'AuthAPIGateway', label: 'Autenticação' },
    // Internal Systems
    { source: 'AuthAPIGateway', target: 'Atlas' },
    { source: 'Atlas', target: 'Profile', label: 'Service\nDiscovery' },
    // Market Data
    { source: 'Minerva', target: 'Profile', label: 'Cotações' },
    { source: 'Minerva', target: 'Nasdaq Gateway', waypoints: [{x: 800, y: 100}, {x: 950, y: 100}], label: 'Mercury\nExchanges' },
    { source: 'Minerva', target: 'Nasdaq Gateway' },
    { source: 'Profile', target: 'Athena', label: 'Métricas' },
    { source: 'Athena', target: 'Hermes', label: 'Métricas' },
    { source: 'Nasdaq Gateway', target: 'Replay Dual' },
    // Access Layer Connections
    { source: 'CopyInvest', target: 'MercuryProxy' },
    { source: 'Apollo', target: 'MercuryProxy' },
    { source: 'Atlas', target: 'MercuryProxy' },
    { source: 'Profile', target: 'VenusProxy' },
    { source: 'Hermes', target: 'InfoProxy', waypoints: [{ x: 1050, y: 520 }] },
    // Client connections to access layer
    { source: 'MercuryProxy', target: 'Profit Mobile', label: 'Market Data' },
    { source: 'VenusProxy', target: 'HomeBrokers', label: 'Layouts/Profile' },
    { source: 'InfoProxy', target: 'HomeBrokers', label: 'News/Data' },
    // Monitoring Connections
    { source: 'Nasdaq Gateway', target: 'InstrumentationService', curve: 'basis' },
    { source: 'Replay Dual', target: 'InstrumentationService', curve: 'basis' },
    { source: 'Hermes', target: 'InstrumentationService', curve: 'basis' },
    { source: 'Nasdaq Gateway', target: 'InstrumentationProxy', curve: 'basis' },
    { source: 'Replay Dual', target: 'InstrumentationProxy', curve: 'basis' },
    { source: 'Hermes', target: 'InstrumentationProxy', curve: 'basis' },
    { source: 'InstrumentationService', target: 'Zabbix', label: 'Métricas' },
    { source: 'InstrumentationService', target: 'InstrumentationProxy', label: 'Logs' },
    { source: 'InstrumentationProxy', target: 'WDI', label: 'Logs' },
    { source: 'InstrumentationProxy', target: 'LogAPI', label: 'Logs' },
  ];

  private archLayers: ArchLayer[] = [
    { id: 'roteamento', label: 'Roteamento', x: 50, y: 150, width: 400, height: 350, labelPos: 'top' },
    { id: 'acesso', label: 'Camada de Acesso', x: 150, y: 575, width: 850, height: 75, labelPos: 'left' },
    { id: 'internos', label: 'Sistemas Internos', x: 550, y: 250, width: 200, height: 150, labelPos: 'top' },
    { id: 'marketdata', label: 'Market Data', x: 770, y: 130, width: 420, height: 310, labelPos: 'top' },
    { id: 'monitoring', label: 'Camada de Monitoramento e Logs', x: 920, y: 80, width: 620, height: 500, labelPos: 'top' },
  ];

  private nodeMap: Map<string, DiagramNode> = new Map();

  ngAfterViewInit(): void {
    if (this.svgContainer()) {
      this.createGraph();
    }
  }

  onResize() {
    // The graph is static, but we can potentially re-center or re-scale if needed.
    // For now, a resize redraw isn't strictly necessary due to viewBox.
  }

  closeDetails(): void {
    this.selectedNode.set(null);
  }

  private createGraph(): void {
    this.nodeMap = new Map(this.nodes.map(n => [n.id, n]));
    const element = this.svgContainer().nativeElement;
    d3.select(element).selectAll("*").remove();

    const svg = d3.select(element).attr('viewBox', [0, 0, 1600, 850].join(' '));

    const groupColors = {
      red: '#ef4444',
      orange: '#f97316',
      green: '#22c55e',
      black: '#f5f5f5',
      blue: '#3b82f6'
    };

    // --- DEFS ---
    const defs = svg.append('defs');
    defs.append('marker')
      .attr('id', 'arrowhead')
      .attr('viewBox', '-0 -5 10 10')
      .attr('refX', 10)
      .attr('refY', 0)
      .attr('orient', 'auto')
      .attr('markerWidth', 8)
      .attr('markerHeight', 8)
      .append('svg:path')
      .attr('d', 'M 0,-5 L 10 ,0 L 0,5')
      .attr('fill', '#999')
      .attr('class', 'arrowhead-path'); // Add class for styling

    // Glow filter
    const filter = defs.append("filter")
      .attr("id", "glow");
    filter.append("feGaussianBlur")
      .attr("stdDeviation", "3.5")
      .attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // --- ARCHITECTURAL LAYERS ---
    const layers = svg.append('g').attr('class', 'layers');
    const layer = layers.selectAll('g')
      .data(this.archLayers)
      .join('g');

    layer.append('rect')
      .attr('x', d => d.x)
      .attr('y', d => d.y)
      .attr('width', d => d.width)
      .attr('height', d => d.height)
      .attr('fill', 'none')
      .attr('stroke', '#4b5563')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '8 8');

    layer.append('text')
      .attr('x', d => d.labelPos === 'top' ? d.x + 15 : d.x - 10)
      .attr('y', d => d.labelPos === 'top' ? d.y - 10 : d.y + d.height / 2)
      .attr('text-anchor', d => d.labelPos === 'top' ? 'start' : 'end')
      .attr('dominant-baseline', 'middle')
      .attr('writing-mode', d => d.labelPos === 'left' ? 'tb' : 'inherit')
      .attr('font-size', '14px')
      .attr('font-weight', 'bold')
      .attr('fill', '#9ca3af')
      .text(d => d.label);


    // --- LINKS ---
    const linkGroup = svg.append('g').attr('class', 'links');
    const links = linkGroup.selectAll('g')
      .data(this.links)
      .enter()
      .append('g')
      .attr('class', 'link-container')
      .style('opacity', 0); // For fade-in animation
    
    links.append('path')
      .attr('d', d => this.getLinkPath(d))
      .attr('stroke', '#999')
      .attr('stroke-width', 1.5)
      .attr('fill', 'none')
      .attr('marker-end', 'url(#arrowhead)');

    links.each((d, i, nodes) => {
        if (d.label) {
            const pathNode = d3.select(nodes[i]).select('path').node() as SVGPathElement;
            if(!pathNode || !pathNode.getTotalLength()) return;
            let {x, y} = this.getLabelPosition(d, pathNode);
            const text = d3.select(nodes[i]).append('text')
                .attr('x', x)
                .attr('y', y)
                .attr('text-anchor', 'middle')
                .attr('font-size', '10px')
                .attr('fill', '#cbd5e1')
                .attr('paint-order', 'stroke')
                .attr('stroke', '#111827') // Match background for halo effect
                .attr('stroke-width', '3px');
            d.label.split('\n').forEach((line, index) => {
                text.append('tspan')
                    .attr('x', x)
                    .attr('dy', index === 0 ? 0 : '1.2em')
                    .text(line);
            });
        }
    });

    // --- NODES ---
    const node = svg.append('g')
      .selectAll('g')
      .data(this.nodes)
      .join('g')
      .attr('transform', d => `translate(${d.x},${d.y})`)
      .style('cursor', 'pointer')
      .style('opacity', 0); // For fade-in animation

    const nodeRadius = 35;

    node.each((d, i, nodes) => {
        const g = d3.select(nodes[i]);
        const color = groupColors[d.group];

        // Outer dashed hexagon/circle
        g.append('path')
            .attr('d', this.getHexagonPath(nodeRadius + 5))
            .attr('fill', 'none')
            .attr('stroke', color)
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', d.group === 'black' ? '6 3' : 'none');

        if (d.shape === 'hexagon') {
             g.append('path')
                .attr('d', this.getHexagonPath(nodeRadius))
                .attr('fill', '#1f2937')
                .attr('stroke', '#9ca3af')
                .attr('stroke-width', 1.5);
        } else if (d.shape === 'icon') {
             g.append('circle').attr('r', 0); // Placeholder for hover area
             g.append('path')
                .attr('d', 'M0-12.5C-6.9-12.5-12.5-6.9-12.5,0S-6.9,12.5,0,12.5,12.5,6.9,12.5,0,6.9-12.5,0-12.5Zm0,5.5A3.5,3.5,0,1,1-3.5-3.5,3.5,3.5,0,0,1,0-7Zm0,18c-4.9,0-9.2-2.8-11.2-7a11.8,11.8,0,0,1,22.4,0c-2,4.2-6.3,7-11.2,7Z')
                .attr('fill', color);
        } else if (d.shape === 'db') {
            g.append('path')
                .attr('d', this.getHexagonPath(nodeRadius))
                .attr('fill', '#1f2937')
                .attr('stroke', '#9ca3af')
                .attr('stroke-width', 1.5);
            g.append('path')
               .attr('d', 'M0-15c-6.9,0-12.5,2.2-12.5,5v20c0,2.8,5.6,5,12.5,5s12.5-2.2,12.5-5V-10C12.5-12.8,6.9-15,0-15Zm0,28.8c-5.8,0-10.5-1.7-10.5-3.8V-5c1.4,1.8,5.5,3,10.5,3s9.1-1.2,10.5-3v19.1c0,2.1-4.7,3.8-10.5,3.8Z M0-6.2c-5.8,0-10.5-1.7-10.5-3.8S-5.8-13.8,0-13.8s10.5,1.7,10.5,3.8S5.8-6.2,0-6.2Z')
               .attr('fill', color)
               .attr('transform', 'scale(0.8)');
        } else if (d.shape === 'zabbix') {
             g.append('path')
                .attr('d', this.getHexagonPath(nodeRadius))
                .attr('fill', '#1f2937')
                .attr('stroke', '#9ca3af')
                .attr('stroke-width', 1.5);
             g.append('path')
                .attr('d', 'M-12-10h4v20h-4z M-2-15h4v25h-4z M8-5h4v15h-4z')
                .attr('fill', color);
        }

        const text = g.append('text')
            .attr('text-anchor', 'middle')
            .attr('fill', '#f3f4f6')
            .attr('font-family', 'Inter, sans-serif');

        text.append('tspan')
            .text(d.id)
            .attr('y', d.subtitle ? -6 : 4)
            .attr('font-size', '12px')
            .attr('font-weight', '500');

        if (d.subtitle) {
            text.append('tspan')
                .text(d.subtitle)
                .attr('x', 0)
                .attr('y', 10)
                .attr('font-size', '9px')
                .attr('fill', '#9ca3af');
        }
    });

    // --- LOAD ANIMATION ---
    node.transition()
      .duration(500)
      .delay((d, i) => i * 10)
      .style('opacity', 1);

    links.transition()
      .duration(500)
      .delay((d, i) => this.nodes.length * 10 + i * 5)
      .style('opacity', 1);

    // --- INTERACTIVITY ---
    const linkedByIndex = new Map<string, Set<string>>();
    this.links.forEach(l => {
        const sourceId = (l.source as any).id || l.source;
        const targetId = (l.target as any).id || l.target;
        if (!linkedByIndex.has(sourceId)) linkedByIndex.set(sourceId, new Set());
        if (!linkedByIndex.has(targetId)) linkedByIndex.set(targetId, new Set());
        linkedByIndex.get(sourceId)?.add(targetId);
        linkedByIndex.get(targetId)?.add(sourceId);
    });

    function isConnected(a: DiagramNode, b: DiagramNode): boolean {
        return linkedByIndex.get(a.id)?.has(b.id) || linkedByIndex.get(b.id)?.has(a.id) || a.id === b.id;
    }

    const container = element.parentElement;

    node.on('click', (event, d) => {
      this.selectedNode.set(d);
    });

    node.on('mouseover', (event, d) => {
        node.transition().duration(200).style('opacity', (o: any) => isConnected(d, o) ? 1.0 : 0.2);
        
        links.transition().duration(200)
            .style('opacity', (l: any) => l.source.id === d.id || l.target.id === d.id ? 1.0 : 0.1)
            .each(function(l: any) {
                if (l.source.id === d.id || l.target.id === d.id) {
                    d3.select(this).style('filter', 'url(#glow)');
                    d3.select(this).select('path').attr('stroke', '#38bdf8');
                    d3.select(this).select('text').attr('fill', '#e0f2fe');
                    d3.select(this).select('.arrowhead-path').attr('fill', '#38bdf8');
                }
            });

        d3.select(event.currentTarget).style('filter', 'url(#glow)');
        
        const tooltipEl = this.tooltip().nativeElement;
        tooltipEl.innerHTML = `
          <h4 class="font-bold text-cyan-400 mb-1">${d.id}</h4>
          <p class="text-gray-300 text-xs">${d.description}</p>
        `;
        tooltipEl.classList.remove('hidden');
    });

    node.on('mousemove', (event) => {
        if (!container) return;
        const containerRect = container.getBoundingClientRect();
        const x = event.clientX - containerRect.left + 15;
        const y = event.clientY - containerRect.top + 15;
        const tooltipEl = this.tooltip().nativeElement;
        tooltipEl.style.left = `${x}px`;
        tooltipEl.style.top = `${y}px`;
    });

    node.on('mouseout', (event) => {
        node.transition().duration(200).style('opacity', 1);
        links.transition().duration(200)
            .style('opacity', 1)
            .each(function() {
                d3.select(this).style('filter', null);
                d3.select(this).select('path').attr('stroke', '#999');
                d3.select(this).select('text').attr('fill', '#cbd5e1');
                d3.select(this).select('.arrowhead-path').attr('fill', '#999');
            });
        
        d3.select(event.currentTarget).style('filter', null);
        this.tooltip().nativeElement.classList.add('hidden');
    });

  }

  private getHexagonPath(radius: number): string {
    const points: [number, number][] = [
        [0, -radius],
        [radius * Math.sqrt(3) / 2, -radius / 2],
        [radius * Math.sqrt(3) / 2, radius / 2],
        [0, radius],
        [-radius * Math.sqrt(3) / 2, radius / 2],
        [-radius * Math.sqrt(3) / 2, -radius / 2]
    ];
    return `M${points.join('L')}Z`;
  }

  private getLinkPath(link: DiagramLink): string {
      const sourceNode = this.nodeMap.get(link.source);
      const targetNode = this.nodeMap.get(link.target);
      if (!sourceNode || !targetNode) return '';
      
      const points: {x: number, y: number}[] = [
        {x: sourceNode.x, y: sourceNode.y},
        ...(link.waypoints || []),
        {x: targetNode.x, y: targetNode.y}
      ];

      const lineGenerator = d3.line<{x:number, y:number}>()
        .x(d => d.x)
        .y(d => d.y);
      
      if (link.curve === 'basis') {
        lineGenerator.curve(d3.curveBasis);
      }

      const pathData = lineGenerator(points);
      if(!pathData) return '';

      // Create a temporary path to calculate the intersection point
      const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      tempPath.setAttribute('d', pathData);
      const pathLength = tempPath.getTotalLength();
      if (pathLength === 0) return '';
      let point = tempPath.getPointAtLength(pathLength); // End point
      const nodeRadius = 40;
      
      for (let i = pathLength; i >= 0; i--) {
        point = tempPath.getPointAtLength(i);
        const dist = Math.sqrt(Math.pow(point.x - targetNode.x, 2) + Math.pow(point.y - targetNode.y, 2));
        if (dist > nodeRadius) {
            break;
        }
      }
      
      if (link.waypoints || link.curve) {
         return pathData; // Let marker handle offset for complex paths for simplicity
      }
      
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      
      // Simple straight line or orthogonal
      const midY = sourceNode.y + dy / 2;
      return `M${sourceNode.x},${sourceNode.y} C${sourceNode.x},${midY} ${point.x},${midY} ${point.x},${point.y}`;
  }

  private getLabelPosition(link: DiagramLink, pathNode: SVGPathElement): { x: number, y: number } {
    const sourceNode = this.nodeMap.get(link.source);
    if (link.labelPos && sourceNode) {
        return { x: sourceNode.x + link.labelPos.x, y: sourceNode.y + link.labelPos.y };
    }
    const length = pathNode.getTotalLength();
    const midPoint = pathNode.getPointAtLength(length / 2);
    return { x: midPoint.x, y: midPoint.y - 8};
  }
}
