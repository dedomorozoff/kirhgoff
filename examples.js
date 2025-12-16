// Library of example circuits

const EXAMPLES = {
    'voltage-divider': {
        name: 'Делитель напряжения',
        description: 'Делитель напряжения - средняя точка (между R1 и R2) имеет половину входного напряжения',
        data: {
            version: '1.1',
            components: [
                { id: 'e1', type: 'voltage', x: 100, y: 300, rotation: 1, value: 10, label: 'E1' },
                { id: 'r1', type: 'resistor', x: 300, y: 200, rotation: 0, value: 100, label: 'R1' },
                { id: 'r2', type: 'resistor', x: 300, y: 400, rotation: 0, value: 100, label: 'R2' },
                { id: 'j1', type: 'junction', x: 100, y: 200, rotation: 0, value: 0, label: 'A' },
                { id: 'j2', type: 'junction', x: 400, y: 200, rotation: 0, value: 0, label: 'B' },
                { id: 'j3', type: 'junction', x: 400, y: 400, rotation: 0, value: 0, label: 'C' },
                { id: 'j4', type: 'junction', x: 100, y: 400, rotation: 0, value: 0, label: 'D' }
            ],
            wires: [
                { startNode: { compId: 'e1', index: 0 }, endNode: { compId: 'j1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'j2', index: 0 }, waypoints: [{ x: 400, y: 200 }] },
                { startNode: { compId: 'j2', index: 1 }, endNode: { compId: 'j3', index: 0 }, waypoints: [{ x: 400, y: 300 }] },
                { startNode: { compId: 'j3', index: 1 }, endNode: { compId: 'r2', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'j4', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j4', index: 1 }, endNode: { compId: 'e1', index: 1 }, waypoints: [] }
            ]
        }
    },
    'series-parallel': {
        name: 'Последовательно-параллельная',
        description: 'Комбинированное соединение резисторов',
        data: {
            version: '1.1',
            components: [
                { id: 'e1', type: 'voltage', x: 100, y: 300, rotation: 1, value: 15, label: 'E1' },
                { id: 'r1', type: 'resistor', x: 250, y: 200, rotation: 0, value: 50, label: 'R1' },
                { id: 'r2', type: 'resistor', x: 500, y: 350, rotation: 1, value: 100, label: 'R2' },
                { id: 'r3', type: 'resistor', x: 400, y: 250, rotation: 1, value: 100, label: 'R3' },
                { id: 'r4', type: 'resistor', x: 250, y: 400, rotation: 0, value: 50, label: 'R4' },
                { id: 'j1', type: 'junction', x: 100, y: 200, rotation: 0, value: 0, label: 'A' },
                { id: 'j2', type: 'junction', x: 400, y: 200, rotation: 0, value: 0, label: 'B' },
                { id: 'j3', type: 'junction', x: 500, y: 400, rotation: 0, value: 0, label: 'C' },
                { id: 'j4', type: 'junction', x: 100, y: 400, rotation: 0, value: 0, label: 'D' }
            ],
            wires: [
                { startNode: { compId: 'e1', index: 0 }, endNode: { compId: 'j1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'j2', index: 0 }, waypoints: [{ x: 350, y: 200 }] },
                { startNode: { compId: 'j2', index: 1 }, endNode: { compId: 'r3', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j2', index: 2 }, endNode: { compId: 'r2', index: 0 }, waypoints: [{ x: 500, y: 200 }] },
                { startNode: { compId: 'r3', index: 1 }, endNode: { compId: 'j3', index: 0 }, waypoints: [{ x: 400, y: 400 }] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'j3', index: 1 }, waypoints: [] },
                { startNode: { compId: 'j3', index: 2 }, endNode: { compId: 'r4', index: 1 }, waypoints: [{ x: 350, y: 400 }] },
                { startNode: { compId: 'r4', index: 0 }, endNode: { compId: 'j4', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j4', index: 1 }, endNode: { compId: 'e1', index: 1 }, waypoints: [] }
            ]
        }
    },
    'simple-circuit': {
        name: 'Простая цепь',
        description: 'Базовая схема с одним резистором',
        data: {
            version: '1.1',
            components: [
                { id: 'e1', type: 'voltage', x: 100, y: 250, rotation: 1, value: 9, label: 'E1' },
                { id: 'r1', type: 'resistor', x: 300, y: 150, rotation: 0, value: 100, label: 'R1' },
                { id: 'j1', type: 'junction', x: 100, y: 150, rotation: 0, value: 0, label: 'A' },
                { id: 'j2', type: 'junction', x: 400, y: 250, rotation: 0, value: 0, label: 'B' }
            ],
            wires: [
                { startNode: { compId: 'e1', index: 0 }, endNode: { compId: 'j1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'j1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'j2', index: 0 }, waypoints: [{ x: 400, y: 150 }] },
                { startNode: { compId: 'j2', index: 1 }, endNode: { compId: 'e1', index: 1 }, waypoints: [{ x: 400, y: 350 }, { x: 100, y: 350 }] }
            ]
        }
    }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXAMPLES;
}
