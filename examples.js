// Library of example circuits

const EXAMPLES = {
    'voltage-divider': {
        name: 'Делитель напряжения',
        description: 'Простая схема делителя напряжения на двух резисторах',
        data: {
            version: '1.1',
            components: [
                { id: 'v1', type: 'voltage', x: 100, y: 200, rotation: 1, value: 10 },
                { id: 'r1', type: 'resistor', x: 300, y: 100, rotation: 0, value: 100 },
                { id: 'r2', type: 'resistor', x: 300, y: 300, rotation: 0, value: 100 }
            ],
            wires: [
                { startNode: { compId: 'v1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [{ x: 100, y: 100 }, { x: 270, y: 100 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'r2', index: 0 }, waypoints: [{ x: 330, y: 100 }, { x: 330, y: 200 }, { x: 270, y: 200 }, { x: 270, y: 300 }] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'v1', index: 0 }, waypoints: [{ x: 330, y: 300 }, { x: 330, y: 400 }, { x: 100, y: 400 }, { x: 100, y: 300 }] }
            ]
        }
    },
    'wheatstone-bridge': {
        name: 'Мост Уитстона',
        description: 'Классическая мостовая схема для измерения сопротивления',
        data: {
            version: '1.1',
            components: [
                { id: 'v1', type: 'voltage', x: 100, y: 250, rotation: 1, value: 12 },
                { id: 'r1', type: 'resistor', x: 250, y: 150, rotation: 0, value: 100 },
                { id: 'r2', type: 'resistor', x: 400, y: 150, rotation: 0, value: 100 },
                { id: 'r3', type: 'resistor', x: 250, y: 350, rotation: 0, value: 100 },
                { id: 'r4', type: 'resistor', x: 400, y: 350, rotation: 0, value: 100 },
                { id: 'vm1', type: 'voltmeter', x: 325, y: 250, rotation: 0, value: 0 }
            ],
            wires: [
                { startNode: { compId: 'v1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [{ x: 100, y: 150 }, { x: 220, y: 150 }] },
                { startNode: { compId: 'v1', index: 1 }, endNode: { compId: 'r3', index: 0 }, waypoints: [{ x: 100, y: 150 }, { x: 100, y: 350 }, { x: 220, y: 350 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'r2', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r3', index: 1 }, endNode: { compId: 'r4', index: 0 }, waypoints: [] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'v1', index: 0 }, waypoints: [{ x: 430, y: 150 }, { x: 500, y: 150 }, { x: 500, y: 450 }, { x: 100, y: 450 }, { x: 100, y: 350 }] },
                { startNode: { compId: 'r4', index: 1 }, endNode: { compId: 'v1', index: 0 }, waypoints: [{ x: 430, y: 350 }, { x: 500, y: 350 }, { x: 500, y: 450 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'vm1', index: 0 }, waypoints: [{ x: 280, y: 150 }, { x: 280, y: 250 }, { x: 300, y: 250 }] },
                { startNode: { compId: 'r3', index: 1 }, endNode: { compId: 'vm1', index: 1 }, waypoints: [{ x: 280, y: 350 }, { x: 280, y: 250 }, { x: 350, y: 250 }] }
            ]
        }
    },
    'series-parallel': {
        name: 'Последовательно-параллельная схема',
        description: 'Комбинированное соединение резисторов',
        data: {
            version: '1.1',
            components: [
                { id: 'v1', type: 'voltage', x: 100, y: 250, rotation: 1, value: 15 },
                { id: 'r1', type: 'resistor', x: 250, y: 150, rotation: 0, value: 50 },
                { id: 'r2', type: 'resistor', x: 400, y: 200, rotation: 1, value: 100 },
                { id: 'r3', type: 'resistor', x: 400, y: 300, rotation: 1, value: 100 },
                { id: 'r4', type: 'resistor', x: 250, y: 350, rotation: 0, value: 50 }
            ],
            wires: [
                { startNode: { compId: 'v1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [{ x: 100, y: 150 }, { x: 220, y: 150 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'r2', index: 0 }, waypoints: [{ x: 280, y: 150 }, { x: 400, y: 150 }, { x: 400, y: 170 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'r3', index: 0 }, waypoints: [{ x: 280, y: 150 }, { x: 350, y: 150 }, { x: 350, y: 270 }] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'r4', index: 0 }, waypoints: [{ x: 400, y: 230 }, { x: 400, y: 350 }, { x: 280, y: 350 }] },
                { startNode: { compId: 'r3', index: 1 }, endNode: { compId: 'r4', index: 0 }, waypoints: [{ x: 400, y: 330 }, { x: 400, y: 350 }] },
                { startNode: { compId: 'r4', index: 1 }, endNode: { compId: 'v1', index: 0 }, waypoints: [{ x: 220, y: 350 }, { x: 100, y: 350 }] }
            ]
        }
    },
    'current-source': {
        name: 'Источник тока',
        description: 'Схема с источником тока и измерительными приборами',
        data: {
            version: '1.1',
            components: [
                { id: 'i1', type: 'current', x: 150, y: 250, rotation: 1, value: 0.05 },
                { id: 'r1', type: 'resistor', x: 300, y: 150, rotation: 0, value: 200 },
                { id: 'r2', type: 'resistor', x: 300, y: 350, rotation: 0, value: 300 },
                { id: 'am1', type: 'ammeter', x: 450, y: 250, rotation: 0, value: 0 }
            ],
            wires: [
                { startNode: { compId: 'i1', index: 1 }, endNode: { compId: 'r1', index: 0 }, waypoints: [{ x: 150, y: 150 }, { x: 270, y: 150 }] },
                { startNode: { compId: 'r1', index: 1 }, endNode: { compId: 'am1', index: 0 }, waypoints: [{ x: 330, y: 150 }, { x: 450, y: 150 }, { x: 450, y: 220 }] },
                { startNode: { compId: 'am1', index: 1 }, endNode: { compId: 'i1', index: 0 }, waypoints: [{ x: 450, y: 280 }, { x: 450, y: 450 }, { x: 150, y: 450 }, { x: 150, y: 350 }] },
                { startNode: { compId: 'i1', index: 1 }, endNode: { compId: 'r2', index: 0 }, waypoints: [{ x: 150, y: 150 }, { x: 200, y: 150 }, { x: 200, y: 350 }, { x: 270, y: 350 }] },
                { startNode: { compId: 'r2', index: 1 }, endNode: { compId: 'i1', index: 0 }, waypoints: [{ x: 330, y: 350 }, { x: 450, y: 350 }, { x: 450, y: 450 }] }
            ]
        }
    }
};

// Export for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EXAMPLES;
}
