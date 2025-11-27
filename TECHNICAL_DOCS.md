# Техническая документация: Интерактивный стенд "Законы Кирхгофа"

## 1. Стек технологий

Проект реализован на чистом стеке веб-технологий без использования фреймворков и внешних зависимостей (Vanilla JS).

*   **HTML5**: Семантическая разметка, использование тега `<canvas>` для графики.
*   **CSS3**:
    *   Использование CSS Variables (Custom Properties) для темизации.
    *   Flexbox для компоновки интерфейса.
    *   Встроенные SVG-иконки (Data URI) для минимизации запросов.
*   **JavaScript (ES6+)**:
    *   Модульная структура (классы).
    *   Отсутствие сборщиков (Webpack/Vite не требуются).

## 2. Архитектура приложения

Приложение построено по принципу **State-Driven Rendering** (отрисовка на основе состояния).

### 2.1. Состояние (`state`)
Глобальный объект `state` хранит всю информацию о текущей схеме:

```javascript
const state = {
    components: [], // Массив объектов Component
    wires: [],      // Массив объектов Wire
    mode: 'select', // Текущий режим: 'select' или 'wire'
    isSimulating: false,
    simulationResult: null, // Результаты расчета (MNA)
    view: { x: 0, y: 0, scale: 1 } // Параметры Zoom & Pan
};
```

### 2.2. Основной цикл (`loop`)
Используется `requestAnimationFrame` для непрерывной перерисовки холста.

```javascript
function loop() {
    draw();
    requestAnimationFrame(loop);
}
```

## 3. Ключевые алгоритмы

### 3.1. Симуляция цепи (MNA)
Для расчета токов и напряжений используется **Метод Узловых Потенциалов (Modified Nodal Analysis - MNA)**.

**Шаг 1: Поиск узлов**
Алгоритм обходит граф соединений (BFS) и группирует соединенные клеммы в электрические узлы.

```javascript
// Пример логики поиска узлов (упрощено)
for (const [startId, _] of adj) {
    if (!visited.has(startId)) {
        // BFS обход для поиска всех соединенных клемм
        // ...
        nodeCount++;
    }
}
```

**Шаг 2: Формирование матрицы**
Составляется система линейных уравнений `Ax = b`.
*   **Матрица A**: Проводимости (G) и связи источников ЭДС.
*   **Вектор b**: Значения источников тока и напряжения.

```javascript
// Заполнение матрицы проводимостей для резистора
const g = 1 / c.value;
A[i1][i1] += g;
A[i1][i2] -= g;
// ...
```

**Шаг 3: Решение СЛАУ**
Используется метод Гаусса для решения системы.

```javascript
class LinearAlgebra {
    static solve(A, b) {
        // Реализация метода Гаусса
        // ...
        return x; // Вектор неизвестных (потенциалы узлов и токи источников)
    }
}
```

### 3.2. Отрисовка проводов
Провода поддерживают произвольное количество точек изгиба (waypoints).

```javascript
class Wire {
    draw(ctx) {
        const start = this.getStartPos();
        const end = this.getEndPos();

        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        // Отрисовка через все промежуточные точки
        this.waypoints.forEach(p => ctx.lineTo(p.x, p.y));
        ctx.lineTo(end.x, end.y);
        ctx.stroke();
    }
}
```

### 3.3. Навигация (Zoom & Pan)
Реализована трансформация контекста Canvas для поддержки масштабирования и панорамирования.

```javascript
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    
    // Применение трансформации
    ctx.translate(state.view.x, state.view.y);
    ctx.scale(state.view.scale, state.view.scale);
    
    // Отрисовка мира в мировых координатах
    // ...
    
    ctx.restore();
}
```

**Обработка событий мыши для Zoom:**

```javascript
canvas.addEventListener('wheel', (e) => {
    // Вычисление нового масштаба и смещения, 
    // чтобы точка под курсором оставалась на месте
    // ...
    state.view.scale = newScale;
    state.view.x = mouseX - worldX * state.view.scale;
    state.view.y = mouseY - worldY * state.view.scale;
});
```

## 4. Структура файлов

*   `index.html`: Каркас приложения, верстка панелей инструментов.
*   `style.css`: Стили интерфейса, иконки.
*   `script.js`: Вся логика приложения (классы, обработчики событий, математическое ядро).
