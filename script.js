/**
 * Interactive Kirchhoff's Laws Stand
 * Main Application Script
 */

// Constants
const GRID_SIZE = 20;
const SNAP_RADIUS = 10;

// Application State
const state = {
    components: [],
    nodes: [],
    wires: [],
    selected: null,
    isDragging: false,
    dragComponent: null,
    mode: 'select', // select, wire
    isSimulating: false,
    simulationResult: null,
    mouse: { x: 0, y: 0 },
    // Wire drawing state
    isDrawingWire: false,
    wireStartNode: null,
    wirePath: [], // Array of {x, y} waypoints
    // Wire editing state
    isDraggingWaypoint: false,
    dragWaypointIndex: -1,
    dragWire: null,
    autoRoute: true, // Auto orthogonal routing
    kvlPath: [], // List of components selected for KVL loop
    view: { x: 0, y: 0, scale: 1 } // Zoom and Pan
};

// Canvas Setup
const canvas = document.getElementById('circuit-canvas');
const ctx = canvas.getContext('2d');

// Resize Canvas
function resizeCanvas() {
    const container = canvas.parentElement;
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    draw();
}

window.addEventListener('resize', resizeCanvas);
resizeCanvas();

// --- Classes ---
// ... (Component and Wire classes remain the same, they use world coords)

// ...

// --- Interaction ---

function snapToGrid(val) {
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const screenX = evt.clientX - rect.left;
    const screenY = evt.clientY - rect.top;

    // Convert to world coordinates
    return {
        x: (screenX - state.view.x) / state.view.scale,
        y: (screenY - state.view.y) / state.view.scale
    };
}

// --- Classes ---

class Component {
    constructor(type, x, y) {
        this.id = crypto.randomUUID();
        this.type = type; // 'resistor', 'voltage', 'current', 'ammeter', 'voltmeter'
        this.x = x;
        this.y = y;
        this.rotation = 0; // 0, 1, 2, 3 (x90 degrees)
        
        // Set default values based on type
        if (type === 'resistor') {
            this.value = 100; // Ohms
        } else if (type === 'voltage') {
            this.value = 5; // Volts
        } else if (type === 'current') {
            this.value = 0.1; // Amperes
        } else {
            this.value = 0; // Meters don't have editable values
        }
        
        this.width = 60;
        this.height = 20;
        // Terminals (relative to center)
        this.terminals = [
            { x: -30, y: 0 },
            { x: 30, y: 0 }
        ];
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation * Math.PI / 2);

        // Draw selection highlight
        if (state.selected === this) {
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2;
            ctx.strokeRect(-this.width / 2 - 5, -this.height / 2 - 5, this.width + 10, this.height + 10);
        }

        // Draw component body
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 2;
        ctx.fillStyle = '#fff';

        if (this.type === 'resistor') {
            // Rectangle (GOST standard)
            ctx.beginPath();
            ctx.rect(-20, -10, 40, 20);
            ctx.stroke();

            // Leads
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(-20, 0);
            ctx.moveTo(20, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#000';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.value} Ом`, 0, -15);
        } else if (this.type === 'voltage') {
            // DC Source symbol
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(-5, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(5, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();

            // Long bar (+)
            ctx.beginPath();
            ctx.moveTo(5, -15);
            ctx.lineTo(5, 15);
            ctx.lineWidth = 3;
            ctx.stroke();

            // Short bar (-)
            ctx.beginPath();
            ctx.moveTo(-5, -8);
            ctx.lineTo(-5, 8);
            ctx.lineWidth = 3;
            ctx.stroke();

            // Text
            ctx.fillStyle = '#000';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.value}V`, 0, -20);
        } else if (this.type === 'current') {
            // Current Source symbol
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(-10, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();

            // Circle
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.stroke();

            // Arrow inside
            ctx.beginPath();
            ctx.moveTo(-5, 0);
            ctx.lineTo(5, 0);
            ctx.lineTo(2, -3);
            ctx.moveTo(5, 0);
            ctx.lineTo(2, 3);
            ctx.stroke();

            // Text
            ctx.fillStyle = '#000';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(`${this.value}A`, 0, -18);
        } else if (this.type === 'ammeter') {
            // Ammeter symbol
            ctx.beginPath();
            ctx.moveTo(-30, 0);
            ctx.lineTo(-12, 0);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(12, 0);
            ctx.lineTo(30, 0);
            ctx.stroke();

            // Circle
            ctx.beginPath();
            ctx.arc(0, 0, 12, 0, Math.PI * 2);
            ctx.stroke();

            // Letter A
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('A', 0, 0);
        } else if (this.type === 'voltmeter') {
            // Voltmeter symbol (parallel connection, different terminals)
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.stroke();

            // Letter V
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('V', 0, 0);

            // Leads (shorter for parallel connection)
            ctx.strokeStyle = '#1f2937';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-15, 0);
            ctx.lineTo(-25, 0);
            ctx.moveTo(15, 0);
            ctx.lineTo(25, 0);
            ctx.stroke();

            // Override terminals for voltmeter
            this.terminals = [
                { x: -25, y: 0 },
                { x: 25, y: 0 }
            ];
        }

        // Draw terminals
        ctx.fillStyle = '#ef4444';
        for (const t of this.terminals) {
            ctx.beginPath();
            ctx.arc(t.x, t.y, 3, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getTerminalsWorld() {
        // Return world coordinates of terminals
        const cos = Math.cos(this.rotation * Math.PI / 2);
        const sin = Math.sin(this.rotation * Math.PI / 2);
        return this.terminals.map(t => ({
            x: this.x + (t.x * cos - t.y * sin),
            y: this.y + (t.x * sin + t.y * cos)
        }));
    }

    hitTest(x, y) {
        // Simple bounding box hit test (approximate for rotation)
        const w = Math.max(this.width, this.height) + 10;
        return (Math.abs(x - this.x) < w / 2 && Math.abs(y - this.y) < w / 2);
    }
}

// Helper function for orthogonal wire routing
function createOrthogonalPath(start, end) {
    const waypoints = [];
    const dx = end.x - start.x;
    const dy = end.y - start.y;

    // Simple L-shaped routing
    if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal first
        const midX = start.x + dx / 2;
        waypoints.push({ x: snapToGrid(midX), y: snapToGrid(start.y) });
        waypoints.push({ x: snapToGrid(midX), y: snapToGrid(end.y) });
    } else {
        // Vertical first
        const midY = start.y + dy / 2;
        waypoints.push({ x: snapToGrid(start.x), y: snapToGrid(midY) });
        waypoints.push({ x: snapToGrid(end.x), y: snapToGrid(midY) });
    }

    return waypoints;
}

class Wire {
    constructor(startNode, endNode, waypoints = []) {
        this.startNode = startNode; // {comp, index}
        this.endNode = endNode;     // {comp, index}
        this.waypoints = waypoints; // Array of {x, y}
    }

    getStartPos() {
        const terminals = this.startNode.comp.getTerminalsWorld();
        return terminals[this.startNode.index];
    }

    getEndPos() {
        const terminals = this.endNode.comp.getTerminalsWorld();
        return terminals[this.endNode.index];
    }

    draw(ctx) {
        const start = this.getStartPos();
        const end = this.getEndPos();

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        this.waypoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(end.x, end.y);
        ctx.strokeStyle = state.selected === this ? '#2563eb' : '#1f2937';
        ctx.lineWidth = state.selected === this ? 3 : 2;
        ctx.stroke();

        // Draw waypoints if selected
        if (state.selected === this) {
            ctx.fillStyle = '#2563eb';
            this.waypoints.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                ctx.fill();
            });
        }
    }

    hitTest(x, y, threshold = 10) {
        const start = this.getStartPos();
        const end = this.getEndPos();
        const points = [start, ...this.waypoints, end];

        // Check each segment
        for (let i = 0; i < points.length - 1; i++) {
            const p1 = points[i];
            const p2 = points[i + 1];
            const dist = this.distanceToSegment(x, y, p1.x, p1.y, p2.x, p2.y);
            if (dist < threshold) return true;
        }
        return false;
    }

    distanceToSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len2 = dx * dx + dy * dy;
        if (len2 === 0) return Math.hypot(px - x1, py - y1);

        let t = ((px - x1) * dx + (py - y1) * dy) / len2;
        t = Math.max(0, Math.min(1, t));

        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        return Math.hypot(px - projX, py - projY);
    }

    getWaypointAt(x, y, threshold = 10) {
        for (let i = 0; i < this.waypoints.length; i++) {
            const p = this.waypoints[i];
            if (Math.hypot(x - p.x, y - p.y) < threshold) {
                return i;
            }
        }
        return -1;
    }
}

// --- Simulation Engine (MNA) ---

class LinearAlgebra {
    static solve(A, b) {
        // Gaussian elimination
        const n = A.length;
        // Augment A with b
        const M = A.map((row, i) => [...row, b[i]]);

        for (let i = 0; i < n; i++) {
            // Pivot
            let maxRow = i;
            for (let k = i + 1; k < n; k++) {
                if (Math.abs(M[k][i]) > Math.abs(M[maxRow][i])) {
                    maxRow = k;
                }
            }
            [M[i], M[maxRow]] = [M[maxRow], M[i]];

            // Normalize
            const pivot = M[i][i];
            if (Math.abs(pivot) < 1e-10) continue; // Singular or disconnected
            for (let j = i; j <= n; j++) {
                M[i][j] /= pivot;
            }

            // Eliminate
            for (let k = 0; k < n; k++) {
                if (k !== i) {
                    const factor = M[k][i];
                    for (let j = i; j <= n; j++) {
                        M[k][j] -= factor * M[i][j];
                    }
                }
            }
        }

        return M.map(row => row[n]);
    }
}

class CircuitSolver {
    static validate(components, wires) {
        const errors = [];

        // Check if circuit is empty
        if (components.length === 0) {
            errors.push('Схема пуста. Добавьте компоненты.');
            return errors;
        }

        // Check if there are any wires
        if (wires.length === 0) {
            errors.push('Нет соединений. Добавьте провода между компонентами.');
            return errors;
        }

        // Check for isolated components
        const connectedComps = new Set();
        wires.forEach(w => {
            connectedComps.add(w.startNode.comp.id);
            connectedComps.add(w.endNode.comp.id);
        });

        const isolated = components.filter(c => !connectedComps.has(c.id));
        if (isolated.length > 0) {
            errors.push(`Изолированные компоненты: ${isolated.length} шт. Подключите их к схеме.`);
        }

        // Check for voltage sources
        const voltageSources = components.filter(c => c.type === 'voltage');
        if (voltageSources.length === 0) {
            errors.push('Нет источников ЭДС. Добавьте хотя бы один источник напряжения.');
        }

        // Check for load (resistors or meters)
        const loads = components.filter(c => 
            c.type === 'resistor' || c.type === 'ammeter' || c.type === 'voltmeter'
        );
        if (loads.length === 0) {
            errors.push('Нет нагрузки. Добавьте хотя бы один резистор или измерительный прибор.');
        }

        // Check for zero or negative values (skip meters)
        components.forEach(c => {
            // Skip measurement devices
            if (c.type === 'ammeter' || c.type === 'voltmeter') return;
            
            if (c.value <= 0) {
                let name = 'Компонент';
                if (c.type === 'resistor') name = 'Резистор';
                else if (c.type === 'voltage') name = 'Источник ЭДС';
                else if (c.type === 'current') name = 'Источник тока';
                
                errors.push(`${name} имеет недопустимое значение: ${c.value}`);
            }
        });

        return errors;
    }

    static solve(components, wires) {
        // 1. Identify Nodes
        const nodes = []; // Array of sets of connected terminals/points

        // Helper to find node index for a terminal
        const getTerminalId = (t) => `${t.comp.id}_${t.index}`;

        // Build adjacency list for terminals connected by wires
        const adj = new Map();

        // Initialize all component terminals
        components.forEach(c => {
            c.terminals.forEach((_, i) => {
                const id = `${c.id}_${i}`;
                adj.set(id, []);
            });
        });

        // Add wire connections
        wires.forEach(w => {
            const id1 = getTerminalId(w.startNode);
            const id2 = getTerminalId(w.endNode);
            if (adj.has(id1)) adj.get(id1).push(id2);
            if (adj.has(id2)) adj.get(id2).push(id1);
        });

        // BFS/DFS to group connected terminals into nodes
        const visited = new Set();
        const nodeMap = new Map(); // terminalId -> nodeIndex
        let nodeCount = 0;

        for (const [startId, _] of adj) {
            if (!visited.has(startId)) {
                const queue = [startId];
                visited.add(startId);
                while (queue.length > 0) {
                    const u = queue.shift();
                    nodeMap.set(u, nodeCount);
                    for (const v of adj.get(u)) {
                        if (!visited.has(v)) {
                            visited.add(v);
                            queue.push(v);
                        }
                    }
                }
                nodeCount++;
            }
        }

        // MNA Setup
        // Unknowns: Node voltages (except ground) + Currents through voltage sources
        // Let Node 0 be ground (reference)
        const numNodes = nodeCount;
        const voltageSources = components.filter(c => c.type === 'voltage');
        const numVSources = voltageSources.length;

        // Matrix size: (numNodes - 1) + numVSources
        // But to keep it simple, we can solve for ALL nodes and add an equation V_ground = 0
        // Actually, standard MNA removes ground node equation. Let's remove Node 0.

        const dim = (numNodes - 1) + numVSources;
        const A = Array(dim).fill(0).map(() => Array(dim).fill(0));
        const b = Array(dim).fill(0);

        // Helper to map node index to matrix index
        // Node 0 is ground, so Node k maps to k-1. 
        // Voltage source currents are mapped after nodes.
        const getNodeIdx = (nodeIndex) => {
            if (nodeIndex === 0) return -1; // Ground
            return nodeIndex - 1;
        };

        const getSourceIdx = (sourceIndex) => {
            return (numNodes - 1) + sourceIndex;
        };

        // Fill G matrix (Conductances)
        components.forEach(c => {
            if (c.type === 'resistor' || c.type === 'ammeter' || c.type === 'voltmeter') {
                const n1 = nodeMap.get(`${c.id}_0`);
                const n2 = nodeMap.get(`${c.id}_1`);
                
                // Set resistance based on type
                let resistance;
                if (c.type === 'resistor') {
                    resistance = c.value;
                } else if (c.type === 'ammeter') {
                    resistance = 0.001; // Very low resistance (1 mOhm)
                } else if (c.type === 'voltmeter') {
                    resistance = 1000000; // Very high resistance (1 MOhm)
                }
                
                const g = 1 / resistance;

                const i1 = getNodeIdx(n1);
                const i2 = getNodeIdx(n2);

                if (i1 !== -1) {
                    A[i1][i1] += g;
                    if (i2 !== -1) A[i1][i2] -= g;
                }
                if (i2 !== -1) {
                    A[i2][i2] += g;
                    if (i1 !== -1) A[i2][i1] -= g;
                }
            }
        });

        // Add current sources to b vector (KCL equations)
        const currentSources = components.filter(c => c.type === 'current');
        currentSources.forEach(cs => {
            const nPos = nodeMap.get(`${cs.id}_1`); // Current flows from terminal 0 to 1
            const nNeg = nodeMap.get(`${cs.id}_0`);

            const iPos = getNodeIdx(nPos);
            const iNeg = getNodeIdx(nNeg);

            // Current source adds to KCL: I flows into positive node, out of negative
            if (iPos !== -1) {
                b[iPos] += cs.value;
            }
            if (iNeg !== -1) {
                b[iNeg] -= cs.value;
            }
        });

        // Fill B and C matrices (Voltage Sources)
        voltageSources.forEach((vs, k) => {
            const nPos = nodeMap.get(`${vs.id}_1`); // Assume terminal 1 is positive (long bar)
            const nNeg = nodeMap.get(`${vs.id}_0`); // Assume terminal 0 is negative

            const iPos = getNodeIdx(nPos);
            const iNeg = getNodeIdx(nNeg);
            const iSrc = getSourceIdx(k);

            // V_pos - V_neg = V_source
            if (iPos !== -1) {
                A[iPos][iSrc] += 1;
                A[iSrc][iPos] += 1;
            }
            if (iNeg !== -1) {
                A[iNeg][iSrc] -= 1;
                A[iSrc][iNeg] -= 1;
            }

            b[iSrc] = vs.value;
        });

        // Solve
        const x = LinearAlgebra.solve(A, b);

        // Extract results
        const nodeVoltages = new Map();
        nodeVoltages.set(0, 0); // Ground
        for (let i = 1; i < numNodes; i++) {
            nodeVoltages.set(i, x[i - 1]);
        }

        const sourceCurrents = new Map();
        voltageSources.forEach((vs, k) => {
            sourceCurrents.set(vs.id, x[(numNodes - 1) + k]);
        });

        return { nodeVoltages, nodeMap, sourceCurrents };
    }
}

// --- Main Loop ---

function draw() {
    // Clear
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    // Apply Zoom and Pan
    ctx.translate(state.view.x, state.view.y);
    ctx.scale(state.view.scale, state.view.scale);

    // Grid (World Coordinates)
    const GRID_EXTENT = 5000;
    ctx.strokeStyle = '#f0f0f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = -GRID_EXTENT; x <= GRID_EXTENT; x += GRID_SIZE) {
        ctx.moveTo(x, -GRID_EXTENT);
        ctx.lineTo(x, GRID_EXTENT);
    }
    for (let y = -GRID_EXTENT; y <= GRID_EXTENT; y += GRID_SIZE) {
        ctx.moveTo(-GRID_EXTENT, y);
        ctx.lineTo(GRID_EXTENT, y);
    }
    ctx.stroke();

    // Wires
    state.wires.forEach(w => w.draw(ctx));

    // Temp wire (while drawing)
    if (state.isDrawingWire && state.wireStartNode) {
        ctx.beginPath();
        // Start from terminal
        const terminals = state.wireStartNode.comp.getTerminalsWorld();
        const start = terminals[state.wireStartNode.index];
        ctx.moveTo(start.x, start.y);

        // Draw through waypoints
        state.wirePath.forEach(p => ctx.lineTo(p.x, p.y));

        // Draw to mouse
        ctx.lineTo(state.mouse.x, state.mouse.y);

        ctx.strokeStyle = '#9ca3af';
        ctx.setLineDash([5, 5]);
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw waypoints
        ctx.fillStyle = '#9ca3af';
        state.wirePath.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    // Components
    state.components.forEach(c => c.draw(ctx));

    // Simulation Overlays
    if (state.isSimulating && state.simulationResult) {
        const { nodeVoltages, nodeMap, sourceCurrents } = state.simulationResult;

        ctx.font = '10px monospace';
        ctx.fillStyle = '#059669';

        state.components.forEach(c => {
            const terminals = c.getTerminalsWorld();
            terminals.forEach((t, i) => {
                const nodeId = `${c.id}_${i}`;
                const nodeIdx = nodeMap.get(nodeId);
                const voltage = nodeVoltages.get(nodeIdx);

                if (voltage !== undefined) {
                    ctx.fillText(`${voltage.toFixed(1)}V`, t.x + 5, t.y - 5);
                }
            });

            // Draw Currents
            if (c.type === 'resistor' || c.type === 'ammeter' || c.type === 'voltmeter') {
                const n1 = nodeMap.get(`${c.id}_0`);
                const n2 = nodeMap.get(`${c.id}_1`);
                const v1 = nodeVoltages.get(n1);
                const v2 = nodeVoltages.get(n2);
                
                let resistance;
                if (c.type === 'resistor') {
                    resistance = c.value;
                } else if (c.type === 'ammeter') {
                    resistance = 0.001;
                } else if (c.type === 'voltmeter') {
                    resistance = 1000000;
                }
                
                const current = (v1 - v2) / resistance;

                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation * Math.PI / 2);

                // Show current for resistors and ammeters
                if (c.type === 'resistor' || c.type === 'ammeter') {
                    ctx.fillStyle = c.type === 'ammeter' ? '#0369a1' : '#dc2626';
                    ctx.fillText(`${Math.abs(current).toFixed(3)}A`, 0, 20);
                }

                // Show voltage for voltmeter
                if (c.type === 'voltmeter') {
                    ctx.fillStyle = '#0369a1';
                    ctx.fillText(`${Math.abs(v1 - v2).toFixed(2)}V`, 0, 20);
                }

                if (Math.abs(current) > 1e-6 && c.type !== 'voltmeter') {
                    const dir = current > 0 ? 1 : -1;
                    ctx.beginPath();
                    ctx.moveTo(-10 * dir, 5);
                    ctx.lineTo(10 * dir, 5);
                    ctx.lineTo(5 * dir, 0);
                    ctx.moveTo(10 * dir, 5);
                    ctx.lineTo(5 * dir, 10);
                    ctx.strokeStyle = c.type === 'ammeter' ? '#0369a1' : '#dc2626';
                    ctx.stroke();
                }

                ctx.restore();
            } else if (c.type === 'current') {
                // Show current source value
                ctx.save();
                ctx.translate(c.x, c.y);
                ctx.rotate(c.rotation * Math.PI / 2);
                ctx.fillStyle = '#7c3aed';
                ctx.fillText(`${c.value.toFixed(3)}A`, 0, 20);
                ctx.restore();
            }
        });
    }

    // KVL Path Highlight
    if (state.isSimulating && state.kvlPath.length > 0) {
        ctx.save();
        
        // Подсветка компонентов в контуре
        ctx.strokeStyle = '#d97706'; // Amber
        ctx.lineWidth = 4;
        state.kvlPath.forEach((c, index) => {
            ctx.save();
            ctx.translate(c.x, c.y);
            ctx.rotate(c.rotation * Math.PI / 2);
            ctx.strokeRect(-c.width / 2 - 8, -c.height / 2 - 8, c.width + 16, c.height + 16);
            ctx.restore();
            
            // Нумерация компонентов
            ctx.fillStyle = '#d97706';
            ctx.font = 'bold 16px Inter';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${index + 1}`, c.x, c.y - 40);
        });
        
        // Стрелки направления обхода между компонентами
        if (state.kvlPath.length > 1) {
            ctx.strokeStyle = '#d97706';
            ctx.fillStyle = '#d97706';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            
            for (let i = 0; i < state.kvlPath.length; i++) {
                const current = state.kvlPath[i];
                const next = state.kvlPath[(i + 1) % state.kvlPath.length];
                
                // Линия от текущего к следующему
                ctx.beginPath();
                ctx.moveTo(current.x, current.y);
                ctx.lineTo(next.x, next.y);
                ctx.stroke();
                
                // Стрелка в середине линии
                const midX = (current.x + next.x) / 2;
                const midY = (current.y + next.y) / 2;
                const angle = Math.atan2(next.y - current.y, next.x - current.x);
                
                ctx.save();
                ctx.translate(midX, midY);
                ctx.rotate(angle);
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(-10, -5);
                ctx.lineTo(-10, 5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            
            ctx.setLineDash([]);
        }
        
        ctx.restore();
    }

    ctx.restore();
}

function loop() {
    draw();
    requestAnimationFrame(loop);
}
loop();

// --- Interaction ---

function snapToGrid(val) {
    return Math.round(val / GRID_SIZE) * GRID_SIZE;
}

function getMousePos(evt) {
    const rect = canvas.getBoundingClientRect();
    const screenX = evt.clientX - rect.left;
    const screenY = evt.clientY - rect.top;

    // Convert to world coordinates
    return {
        x: (screenX - state.view.x) / state.view.scale,
        y: (screenY - state.view.y) / state.view.scale
    };
}

// Zoom
canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const zoomIntensity = 0.1;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Get world coordinates before zoom
    const worldX = (mouseX - state.view.x) / state.view.scale;
    const worldY = (mouseY - state.view.y) / state.view.scale;

    // Update scale
    const delta = e.deltaY < 0 ? 1 : -1;
    const newScale = state.view.scale * (1 + delta * zoomIntensity);

    // Clamp scale
    if (newScale < 0.1 || newScale > 5) return;

    state.view.scale = newScale;

    // Adjust position to keep mouse over same world point
    state.view.x = mouseX - worldX * state.view.scale;
    state.view.y = mouseY - worldY * state.view.scale;

    draw();
}, { passive: false });

// Zoom buttons
document.getElementById('btn-zoom-in').addEventListener('click', () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldX = (centerX - state.view.x) / state.view.scale;
    const worldY = (centerY - state.view.y) / state.view.scale;
    
    const newScale = Math.min(state.view.scale * 1.2, 5);
    state.view.scale = newScale;
    state.view.x = centerX - worldX * state.view.scale;
    state.view.y = centerY - worldY * state.view.scale;
    draw();
});

document.getElementById('btn-zoom-out').addEventListener('click', () => {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const worldX = (centerX - state.view.x) / state.view.scale;
    const worldY = (centerY - state.view.y) / state.view.scale;
    
    const newScale = Math.max(state.view.scale / 1.2, 0.1);
    state.view.scale = newScale;
    state.view.x = centerX - worldX * state.view.scale;
    state.view.y = centerY - worldY * state.view.scale;
    draw();
});

document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    state.view.scale = 1;
    state.view.x = 0;
    state.view.y = 0;
    draw();
});

function getHoveredTerminal(x, y) {
    for (const comp of state.components) {
        const terminals = comp.getTerminalsWorld();
        for (let i = 0; i < terminals.length; i++) {
            const t = terminals[i];
            const dist = Math.hypot(t.x - x, t.y - y);
            if (dist < SNAP_RADIUS) {
                return { comp, index: i, x: t.x, y: t.y };
            }
        }
    }
    return null;
}

// Drag and Drop from Palette
const paletteItems = document.querySelectorAll('.palette-item[draggable="true"]');
paletteItems.forEach(item => {
    item.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('type', item.dataset.type);
        state.mode = 'select'; // Switch back to select mode on drag
    });
});

// Wire mode toggle
document.getElementById('mode-wire').addEventListener('click', () => {
    state.mode = 'wire';
    state.selected = null;
    state.isDrawingWire = false;
    state.wireStartNode = null;
    state.wirePath = [];
    draw();
});

// Auto-route toggle
document.getElementById('auto-route').addEventListener('change', (e) => {
    state.autoRoute = e.target.checked;
});

canvas.addEventListener('dragover', (e) => {
    e.preventDefault();
});

canvas.addEventListener('drop', (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('type');
    const pos = getMousePos(e);
    const comp = new Component(type, snapToGrid(pos.x), snapToGrid(pos.y));
    state.components.push(comp);
    selectComponent(comp);
    draw();
});

// Selection & Properties - Bottom Panel
const componentProps = document.getElementById('component-props');
const compTypeLabel = document.getElementById('comp-type-label');
const resistanceInput = document.getElementById('resistance-input');
const voltageInput = document.getElementById('voltage-input');
const currentInput = document.getElementById('current-input');
const propRes = document.getElementById('prop-resistance');
const propVolt = document.getElementById('prop-voltage');
const propCurrent = document.getElementById('prop-current');
const meterReading = document.getElementById('meter-reading');
const meterValue = document.getElementById('meter-value');
const divider1 = document.getElementById('divider-1');
const helpText = document.getElementById('help-text');

function selectComponent(comp) {
    state.selected = comp;
    
    if (comp) {
        componentProps.style.display = 'flex';
        divider1.style.display = 'block';
        
        // Hide all inputs first
        resistanceInput.style.display = 'none';
        voltageInput.style.display = 'none';
        currentInput.style.display = 'none';
        meterReading.style.display = 'none';

        // Update inputs based on type
        if (comp instanceof Wire) {
            compTypeLabel.textContent = 'Провод';
        } else if (comp.type === 'resistor') {
            compTypeLabel.textContent = 'Резистор:';
            resistanceInput.style.display = 'flex';
            propRes.value = comp.value;
        } else if (comp.type === 'voltage') {
            compTypeLabel.textContent = 'Источник ЭДС:';
            voltageInput.style.display = 'flex';
            propVolt.value = comp.value;
        } else if (comp.type === 'current') {
            compTypeLabel.textContent = 'Источник тока:';
            currentInput.style.display = 'flex';
            propCurrent.value = comp.value;
        } else if (comp.type === 'ammeter') {
            compTypeLabel.textContent = 'Амперметр:';
            if (state.isSimulating && state.simulationResult) {
                meterReading.style.display = 'flex';
                updateMeterReading(comp);
            }
        } else if (comp.type === 'voltmeter') {
            compTypeLabel.textContent = 'Вольтметр:';
            if (state.isSimulating && state.simulationResult) {
                meterReading.style.display = 'flex';
                updateMeterReading(comp);
            }
        }
    } else {
        componentProps.style.display = 'none';
        divider1.style.display = 'none';
    }
    draw();
}

function updateMeterReading(meter) {
    if (!state.simulationResult) return;
    
    if (meter.type === 'ammeter') {
        const n1 = state.simulationResult.nodeMap.get(`${meter.id}_0`);
        const n2 = state.simulationResult.nodeMap.get(`${meter.id}_1`);
        const v1 = state.simulationResult.nodeVoltages.get(n1);
        const v2 = state.simulationResult.nodeVoltages.get(n2);
        const current = (v1 - v2) / 0.001;
        meterValue.textContent = `${Math.abs(current).toFixed(3)} А`;
    } else if (meter.type === 'voltmeter') {
        const n1 = state.simulationResult.nodeMap.get(`${meter.id}_0`);
        const n2 = state.simulationResult.nodeMap.get(`${meter.id}_1`);
        const v1 = state.simulationResult.nodeVoltages.get(n1);
        const v2 = state.simulationResult.nodeVoltages.get(n2);
        const voltage = Math.abs(v1 - v2);
        meterValue.textContent = `${voltage.toFixed(2)} В`;
    }
}

// Canvas Mouse Events
canvas.addEventListener('mousedown', (e) => {
    // Panning (Middle Mouse Button)
    if (e.button === 1) {
        state.isPanning = true;
        state.panStart = { x: e.clientX, y: e.clientY };
        return;
    }

    const pos = getMousePos(e);
    state.mouse = pos;

    if (state.mode === 'wire') {
        const term = getHoveredTerminal(pos.x, pos.y);

        if (!state.isDrawingWire) {
            // Start drawing
            if (term) {
                state.isDrawingWire = true;
                state.wireStartNode = term;
                state.wirePath = [];
            }
        } else {
            // Continue drawing
            if (term) {
                // Clicked on a terminal - finish wire
                if (term.comp !== state.wireStartNode.comp || term.index !== state.wireStartNode.index) {
                    let finalPath = [...state.wirePath];
                    
                    // Apply auto-routing if enabled and no manual waypoints
                    if (state.autoRoute && finalPath.length === 0) {
                        const startTerminals = state.wireStartNode.comp.getTerminalsWorld();
                        const startPos = startTerminals[state.wireStartNode.index];
                        const endTerminals = term.comp.getTerminalsWorld();
                        const endPos = endTerminals[term.index];
                        finalPath = createOrthogonalPath(startPos, endPos);
                    }
                    
                    state.wires.push(new Wire(state.wireStartNode, term, finalPath));
                }
                // Reset
                state.isDrawingWire = false;
                state.wireStartNode = null;
                state.wirePath = [];
            } else {
                // Clicked on empty space - add waypoint
                state.wirePath.push({ x: snapToGrid(pos.x), y: snapToGrid(pos.y) });
            }
        }
        draw();
    } else {
        // Select mode
        // Check if clicking on a waypoint of selected wire
        if (state.selected && state.selected instanceof Wire) {
            const wpIndex = state.selected.getWaypointAt(pos.x, pos.y);
            if (wpIndex !== -1) {
                state.isDraggingWaypoint = true;
                state.dragWaypointIndex = wpIndex;
                state.dragWire = state.selected;
                return;
            }
        }

        // Check components first
        const clickedComp = state.components.find(c => c.hitTest(pos.x, pos.y));

        if (clickedComp) {
            selectComponent(clickedComp);
            state.isDragging = true;
            state.dragComponent = clickedComp;
        } else {
            // Check wires
            const clickedWire = state.wires.find(w => w.hitTest(pos.x, pos.y));
            if (clickedWire) {
                selectComponent(clickedWire);
            } else {
                selectComponent(null);
            }
        }
    }
});

canvas.addEventListener('mousemove', (e) => {
    // Panning
    if (state.isPanning) {
        const dx = e.clientX - state.panStart.x;
        const dy = e.clientY - state.panStart.y;
        state.view.x += dx;
        state.view.y += dy;
        state.panStart = { x: e.clientX, y: e.clientY };
        draw();
        return;
    }

    const pos = getMousePos(e);
    state.mouse = pos;

    if (state.mode === 'wire') {
        // Visual feedback for terminals
        const term = getHoveredTerminal(pos.x, pos.y);
        canvas.style.cursor = term ? 'crosshair' : 'default';

        if (state.isDrawingWire) {
            draw();
        }
    } else if (state.isDraggingWaypoint && state.dragWire) {
        // Drag waypoint
        state.dragWire.waypoints[state.dragWaypointIndex].x = snapToGrid(pos.x);
        state.dragWire.waypoints[state.dragWaypointIndex].y = snapToGrid(pos.y);
        draw();
    } else if (state.isDragging && state.dragComponent) {
        state.dragComponent.x = snapToGrid(pos.x);
        state.dragComponent.y = snapToGrid(pos.y);
        draw();
    } else {
        // Hover effect
        if (state.selected && state.selected instanceof Wire) {
            const wpIndex = state.selected.getWaypointAt(pos.x, pos.y);
            if (wpIndex !== -1) {
                canvas.style.cursor = 'grab';
                return;
            }
        }
        
        const hoveredComp = state.components.find(c => c.hitTest(pos.x, pos.y));
        const hoveredWire = !hoveredComp ? state.wires.find(w => w.hitTest(pos.x, pos.y)) : null;
        canvas.style.cursor = hoveredComp ? 'move' : (hoveredWire ? 'pointer' : 'default');
    }
});

canvas.addEventListener('mouseup', (e) => {
    if (e.button === 1) {
        state.isPanning = false;
        return;
    }

    const pos = getMousePos(e);
    state.isDragging = false;
    state.dragComponent = null;
    state.isDraggingWaypoint = false;
    state.dragWaypointIndex = -1;
    state.dragWire = null;

    // Note: Wire creation is now handled in mousedown (click-click interaction)
});

// Property Updates
propRes.addEventListener('change', (e) => {
    if (state.selected && state.selected.type === 'resistor') {
        state.selected.value = parseFloat(e.target.value);
        draw();
    }
});

propVolt.addEventListener('change', (e) => {
    if (state.selected && state.selected.type === 'voltage') {
        state.selected.value = parseFloat(e.target.value);
        draw();
    }
});

propCurrent.addEventListener('change', (e) => {
    if (state.selected && state.selected.type === 'current') {
        state.selected.value = parseFloat(e.target.value);
        draw();
    }
});

document.getElementById('btn-delete-comp').addEventListener('click', () => {
    if (state.selected) {
        // Remove wires connected to this component
        state.wires = state.wires.filter(w => w.startNode.comp !== state.selected && w.endNode.comp !== state.selected);

        state.components = state.components.filter(c => c !== state.selected);
        selectComponent(null);
        draw();
    }
});

document.getElementById('btn-clear').addEventListener('click', () => {
    state.components = [];
    state.wires = [];
    state.isDrawingWire = false;
    state.wireStartNode = null;
    state.wirePath = [];
    selectComponent(null);
    draw();
});

// Keyboard
window.addEventListener('keydown', (e) => {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (state.selected) {
            if (state.selected instanceof Wire) {
                // Delete wire
                state.wires = state.wires.filter(w => w !== state.selected);
            } else {
                // Delete component and connected wires
                state.wires = state.wires.filter(w => w.startNode.comp !== state.selected && w.endNode.comp !== state.selected);
                state.components = state.components.filter(c => c !== state.selected);
            }
            selectComponent(null);
            draw();
        }
    }
    if (e.key === 'r' || e.key === 'R') {
        if (state.selected && state.selected.rotation !== undefined) {
            state.selected.rotation = (state.selected.rotation + 1) % 4;
            draw();
        }
    }
    if (e.key === 'w' || e.key === 'W') {
        if (state.mode === 'select') {
            state.mode = 'wire';
            state.selected = null;
            state.isDrawingWire = false;
            state.wireStartNode = null;
            state.wirePath = [];
            draw();
        }
    }
    if (e.key === 'Escape') {
        state.mode = 'select';
        state.isDrawingWire = false;
        state.wireStartNode = null;
        state.wirePath = [];
        selectComponent(null);
        draw();
    }
});

// --- Simulation Controls ---

const btnRun = document.getElementById('btn-run');
const btnStop = document.getElementById('btn-stop');
const overlayInfo = document.getElementById('overlay-info');

btnRun.addEventListener('click', () => {
    // Validate circuit first
    const errors = CircuitSolver.validate(state.components, state.wires);
    if (errors.length > 0) {
        showErrorModal(errors);
        return;
    }

    try {
        const result = CircuitSolver.solve(state.components, state.wires);
        state.simulationResult = result;
        state.isSimulating = true;

        btnRun.disabled = true;
        btnStop.disabled = false;
        document.getElementById('btn-clear-loop').disabled = false;

        // Disable editing during simulation
        canvas.style.pointerEvents = 'none'; // Simple lock

        draw();
        updateOverlay();
    } catch (e) {
        showErrorModal([`Ошибка расчета: ${e.message}`, 'Проверьте правильность схемы и значения компонентов.']);
        console.error(e);
    }
});

btnStop.addEventListener('click', () => {
    state.isSimulating = false;
    state.simulationResult = null;
    state.kvlPath = [];

    btnRun.disabled = false;
    btnStop.disabled = true;
    document.getElementById('btn-clear-loop').disabled = true;

    canvas.style.pointerEvents = 'auto';
    overlayInfo.innerHTML = '';
    draw();
});

document.getElementById('btn-clear-loop').addEventListener('click', () => {
    state.kvlPath = [];
    updateOverlay();
    draw();
});

function updateOverlay() {
    if (!state.isSimulating || !state.simulationResult) return;

    // Show node voltages
    let html = '<strong>Результаты:</strong><br>';
    state.simulationResult.nodeVoltages.forEach((v, k) => {
        html += `Узел ${k}: ${v.toFixed(2)} В<br>`;
    });
    overlayInfo.innerHTML = html;
    
    // Update meter reading if meter is selected
    if (state.selected && (state.selected.type === 'ammeter' || state.selected.type === 'voltmeter')) {
        updateMeterReading(state.selected);
    }
}

// --- Educational Tools (KCL/KVL) ---

function getHoveredNode(x, y) {
    // Find terminal near mouse
    const term = getHoveredTerminal(x, y);
    if (term && state.simulationResult) {
        const nodeId = `${term.comp.id}_${term.index}`;
        const nodeIdx = state.simulationResult.nodeMap.get(nodeId);
        return nodeIdx;
    }
    return null;
}

function calculateKCL(nodeIdx) {
    if (!state.simulationResult) return null;

    // Find all components connected to this node
    const currents = [];
    let sum = 0;

    // Iterate all components to find connections to this node
    state.components.forEach(c => {
        const terminals = c.getTerminalsWorld();
        terminals.forEach((t, i) => {
            const tId = `${c.id}_${i}`;
            if (state.simulationResult.nodeMap.get(tId) === nodeIdx) {
                // This terminal is connected to the node
                // Calculate current LEAVING the node through this component
                let current = 0;

                if (c.type === 'resistor') {
                    const n1 = state.simulationResult.nodeMap.get(`${c.id}_0`);
                    const n2 = state.simulationResult.nodeMap.get(`${c.id}_1`);
                    const v1 = state.simulationResult.nodeVoltages.get(n1);
                    const v2 = state.simulationResult.nodeVoltages.get(n2);

                    // Current from 0 to 1 is (V0 - V1) / R
                    const i0to1 = (v1 - v2) / c.value;

                    // If we are at terminal 0, current leaving is i0to1
                    // If we are at terminal 1, current leaving is -i0to1
                    current = (i === 0) ? i0to1 : -i0to1;

                } else if (c.type === 'voltage') {
                    const iSrc = state.simulationResult.sourceCurrents.get(c.id);
                    // Terminal 1 is Positive, Terminal 0 is Negative
                    if (i === 1) { // Positive terminal
                        current = iSrc;
                    } else { // Negative terminal
                        current = -iSrc;
                    }
                }

                currents.push({ comp: c, val: current });
                sum += current;
            }
        });
    });

    return { currents, sum };
}

// Update overlay with KCL info if hovering a node
canvas.addEventListener('mousemove', (e) => {
    if (!state.isSimulating) return;

    const pos = getMousePos(e);
    const nodeIdx = getHoveredNode(pos.x, pos.y);

    if (nodeIdx !== null) {
        const kcl = calculateKCL(nodeIdx);
        if (kcl) {
            let html = `<strong>Узел ${nodeIdx} (KCL):</strong><br>`;
            html += `Потенциал: ${state.simulationResult.nodeVoltages.get(nodeIdx).toFixed(2)} В<br>`;
            html += `Sum I = ${kcl.sum.toFixed(5)} A<br>`;
            html += `<hr>`;
            kcl.currents.forEach(item => {
                const name = item.comp.type === 'resistor' ? 'R' : 'E';
                html += `${name}: ${item.val.toFixed(3)} A<br>`;
            });
            overlayInfo.innerHTML = html;
            return;
        }
    }

    // Default overlay if not hovering node
    updateOverlay();
});

// KVL Tool - Click components to add to path
canvas.addEventListener('click', (e) => {
    if (!state.isSimulating) return;

    const pos = getMousePos(e);
    const clickedComp = state.components.find(c => c.hitTest(pos.x, pos.y));

    if (clickedComp) {
        // Toggle in KVL path
        const idx = state.kvlPath.indexOf(clickedComp);
        if (idx >= 0) {
            state.kvlPath.splice(idx, 1);
        } else {
            state.kvlPath.push(clickedComp);
        }
        updateKVLOverlay();
        draw();
    } else {
        // Clear path if clicked empty space
        state.kvlPath = [];
        updateOverlay();
        draw();
    }
});

function updateKVLOverlay() {
    if (state.kvlPath.length === 0) {
        updateOverlay(); // Revert to default if path is empty
        return;
    }

    let sumV = 0;
    let html = `<strong>Контур (KVL):</strong><br>`;
    html += `<small>Компоненты в контуре (по порядку обхода):</small><br>`;

    state.kvlPath.forEach((c, index) => {
        let vDrop = 0;
        const n1 = state.simulationResult.nodeMap.get(`${c.id}_0`);
        const n2 = state.simulationResult.nodeMap.get(`${c.id}_1`);
        const v1 = state.simulationResult.nodeVoltages.get(n1);
        const v2 = state.simulationResult.nodeVoltages.get(n2);

        vDrop = v1 - v2; // Drop from 0 to 1

        // Для источника ЭДС учитываем знак в зависимости от направления обхода
        if (c.type === 'voltage') {
            // Если обходим от + к -, то ЭДС положительна
            sumV += vDrop;
        } else {
            // Для резистора падение напряжения вычитается
            sumV += vDrop;
        }

        const name = c.type === 'resistor' ? `R${index + 1}` : `E${index + 1}`;
        const arrow = vDrop >= 0 ? '→' : '←';
        html += `${name}: ${vDrop.toFixed(2)} В ${arrow}<br>`;
    });

    html += `<hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;">`;
    html += `<strong>Σ U = ${sumV.toFixed(4)} В</strong><br>`;
    
    // Проверка выполнения второго закона Кирхгофа
    const isValid = Math.abs(sumV) < 0.01; // Погрешность 10 мВ
    if (isValid) {
        html += `<span style="color: #059669;">✓ Второй закон Кирхгофа выполнен</span><br>`;
    } else {
        html += `<span style="color: #dc2626;">⚠ Контур незамкнут или выбран неверно</span><br>`;
    }
    
    html += `<small style="color: #6b7280;">Кликните на пустое место для сброса</small>`;
    overlayInfo.innerHTML = html;
}


// --- Error Modal ---
const errorModal = document.getElementById('error-modal');
const errorList = document.getElementById('error-list');
const modalClose = document.getElementById('modal-close');
const modalOk = document.getElementById('modal-ok');

function showErrorModal(errors) {
    let html = '<ul>';
    errors.forEach(err => {
        html += `<li>${err}</li>`;
    });
    html += '</ul>';
    errorList.innerHTML = html;
    errorModal.style.display = 'flex';
}

function hideErrorModal() {
    errorModal.style.display = 'none';
}

modalClose.addEventListener('click', hideErrorModal);
modalOk.addEventListener('click', hideErrorModal);

// Close modal on outside click
errorModal.addEventListener('click', (e) => {
    if (e.target === errorModal) {
        hideErrorModal();
    }
});

// Close modal on Escape key
window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && errorModal.style.display === 'flex') {
        hideErrorModal();
    }
});


// --- Save/Load Circuit ---
const btnSave = document.getElementById('btn-save');
const btnLoad = document.getElementById('btn-load');
const fileInput = document.getElementById('file-input');

function serializeCircuit() {
    return {
        version: '1.1',
        components: state.components.map(c => ({
            id: c.id,
            type: c.type,
            x: c.x,
            y: c.y,
            rotation: c.rotation,
            value: c.value
        })),
        wires: state.wires.map(w => ({
            startNode: {
                compId: w.startNode.comp.id,
                index: w.startNode.index
            },
            endNode: {
                compId: w.endNode.comp.id,
                index: w.endNode.index
            },
            waypoints: w.waypoints
        }))
    };
}

function deserializeCircuit(data) {
    // Clear current circuit
    state.components = [];
    state.wires = [];
    state.selected = null;
    selectComponent(null);

    // Restore components
    const compMap = new Map();
    data.components.forEach(cData => {
        const comp = new Component(cData.type, cData.x, cData.y);
        comp.id = cData.id;
        comp.rotation = cData.rotation;
        comp.value = cData.value;
        state.components.push(comp);
        compMap.set(comp.id, comp);
    });

    // Restore wires
    data.wires.forEach(wData => {
        const startComp = compMap.get(wData.startNode.compId);
        const endComp = compMap.get(wData.endNode.compId);
        if (startComp && endComp) {
            const wire = new Wire(
                { comp: startComp, index: wData.startNode.index },
                { comp: endComp, index: wData.endNode.index },
                wData.waypoints
            );
            state.wires.push(wire);
        }
    });

    draw();
}

btnSave.addEventListener('click', () => {
    const data = serializeCircuit();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `circuit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
});

btnLoad.addEventListener('click', () => {
    fileInput.click();
});

fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            deserializeCircuit(data);
        } catch (err) {
            showErrorModal(['Ошибка загрузки файла', 'Файл поврежден или имеет неверный формат.']);
            console.error(err);
        }
    };
    reader.readAsText(file);
    fileInput.value = ''; // Reset input
});

// Auto-save to localStorage
function autoSave() {
    try {
        const data = serializeCircuit();
        localStorage.setItem('circuit_autosave', JSON.stringify(data));
    } catch (e) {
        console.warn('Auto-save failed:', e);
    }
}

function autoLoad() {
    try {
        const saved = localStorage.getItem('circuit_autosave');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.components && data.components.length > 0) {
                // Ask user if they want to restore
                if (confirm('Найдено автосохранение. Восстановить схему?')) {
                    deserializeCircuit(data);
                }
            }
        }
    } catch (e) {
        console.warn('Auto-load failed:', e);
    }
}

// Auto-save every 30 seconds
setInterval(autoSave, 30000);

// Load on startup
window.addEventListener('load', () => {
    autoLoad();
});


// --- Examples Library ---
const btnExamples = document.getElementById('btn-examples');
const examplesModal = document.getElementById('examples-modal');
const examplesList = document.getElementById('examples-list');
const examplesClose = document.getElementById('examples-close');

function showExamplesModal() {
    let html = '';
    for (const [key, example] of Object.entries(EXAMPLES)) {
        html += `
            <div class="example-item" data-example="${key}">
                <h4>${example.name}</h4>
                <p>${example.description}</p>
            </div>
        `;
    }
    examplesList.innerHTML = html;
    
    // Add click handlers
    document.querySelectorAll('.example-item').forEach(item => {
        item.addEventListener('click', () => {
            const key = item.dataset.example;
            loadExample(key);
            hideExamplesModal();
        });
    });
    
    examplesModal.style.display = 'flex';
}

function hideExamplesModal() {
    examplesModal.style.display = 'none';
}

function loadExample(key) {
    const example = EXAMPLES[key];
    if (example) {
        deserializeCircuit(example.data);
    }
}

btnExamples.addEventListener('click', showExamplesModal);
examplesClose.addEventListener('click', hideExamplesModal);

examplesModal.addEventListener('click', (e) => {
    if (e.target === examplesModal) {
        hideExamplesModal();
    }
});
