function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const directions = {
    LEFT: 1,
    UP: 2,
    RIGHT: 3,
    DOWN: 4,
};

const oppositeDirection = dir => {
    switch (dir) {
        case directions.LEFT: return directions.RIGHT;
        case directions.RIGHT: return directions.LEFT;
        case directions.UP: return directions.DOWN;
        case directions.DOWN: return directions.UP;
        default: throw new Error('Invalid direction');
    }
};

const gameSize = {
    width: 40,
    height: 20,
};

const createPoint = (x, y) => ({ x, y });

const initialSnake = {
    length: 3,
    head: createPoint(10, 10),
    tail: [createPoint(8, 10), createPoint(9, 10)],
    direction: directions.RIGHT,
    hasGameOver: false,
};

const changeDirection = (s, direction) => {
    const isOppositeDir = direction === oppositeDirection(s.direction);
    if (isOppositeDir) {
        return s;
    }
    return Object.assign({}, s, { direction });
};

const move = s => {
    const tail = [...s.tail.slice(1, s.tail.length), createPoint(s.head.x, s.head.y)];
    switch (s.direction) {
        case directions.LEFT:
            return Object.assign({}, s, {
                head: createPoint(s.head.x - 1, s.head.y),
                tail,
            });
        case directions.UP: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x, s.head.y - 1),
                tail,
            });
        }
        case directions.RIGHT: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x + 1, s.head.y),
                tail,
            });
        }
        case directions.DOWN: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x, s.head.y + 1),
                tail: tail,
            });
        }
        default:
            return s;
    }
};

const moveAndCheckBoundaries = (s, boundaries) => {
    const { x, y } = s.head;
    const nextSnakeState = move(s);
    const didCollideWithTail = s.tail.some(p => p.x === x && p.y === y);
    const willCollideWithWall = nextSnakeState.head.x === -1
        || nextSnakeState.head.x === boundaries.width
        || nextSnakeState.head.y === -1
        || nextSnakeState.head.y === boundaries.height;
    const hasGameOver = didCollideWithTail || willCollideWithWall;
    if (hasGameOver) {
        return Object.assign({}, s, {
            hasGameOver,
        });
    }
    return nextSnakeState;
};

const createApple = (s, boundaries) => {
    const fullSnake = [...s.tail, s.head];
    const field = Array
        .from({ length: boundaries.height }, (_, i) => Array.from({ length: boundaries.width }, (_, i) => i))
        .map((row, y) => {
            if (!fullSnake.some(p => p.y === y)) return row;
            return row.filter(x => !fullSnake.some(p => p.x === x));
        })
        .filter(row => row.length);
    const y = getRandomInt(0, field.length - 1);
    const x = field[y][getRandomInt(0, field[y].length - 1)];
    return createPoint(x, y);
};

const eatApple = s => {
    const movedSnake = move(s);
    return Object.assign({}, s, {
        length: s.length + 1,
        head: createPoint(movedSnake.head.x, movedSnake.head.y),
        tail: [s.tail[s.tail.length - 1], ...movedSnake.tail],
    });
};

const isAppleExist = (apple) => apple.x !== -1 || apple.y !== -1;

const hasBeenAppleEaten = (s, a) => s.head.x === a.x && s.head.y === a.y;

const removeApple = () => createPoint(-1, -1);

const gameTick = game => {
    const hasApple = isAppleExist(game.apple);
    let newSnakeState = moveAndCheckBoundaries(game.snake, game.boundaries);
    let newAppleState = game.apple;
    let newScore = game.score;
    const shouldAppleAppear = Math.random();
    if (!hasApple && shouldAppleAppear > 0.8) {
        newAppleState = createApple(game.snake, game.boundaries);
    }

    if (hasApple && hasBeenAppleEaten(newSnakeState, newAppleState) && !newSnakeState.hasGameOver) {
        newSnakeState = eatApple(newSnakeState);
        newAppleState = removeApple();
        newScore += 1;
    }
    return Object.assign({}, game, {
        snake: newSnakeState,
        apple: newAppleState,
        score: newScore,
    });
};

const travelToPast = history => {
    if (history.length === 1) {
        return {
            history: history,
            frame: history[0],
        };
    }
    return {
        history: history.slice(0, history.length - 1),
        frame: history[history.length - 1],
    }
};

const initialGameState = {
    snake: initialSnake,
    apple: createPoint(-1, -1),
    boundaries: gameSize,
    score: 0,
};


/* View v2. Canvas */

class SnakeRender {
    constructor(id, gameSize) {
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        this.canvasSize = {
            width: this.canvas.width,
            height: this.canvas.height,
        };
        const { width, height } = gameSize;
        this.cellSize = (this.canvas.width / width + this.canvas.height / height) / 2;
    }

    drawGameField() {
        const { ctx, canvas } = this;
        const { width, height } = canvas;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
    }

    coordinatesToReal({x, y}) {
        const { cellSize } = this;
        return {
            x: x * cellSize,
            y: y * cellSize,
        };
    };

    drawRect(point, color = '#CE5B20') {
        const { cellSize } = this;
        const { x, y } = this.coordinatesToReal(point);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, cellSize, cellSize);
    }

    drawSnake(snake) {
        const snakeColor = snake.hasGameOver ? '#ff2837' : '#CE5B20';
        snake.tail.forEach(p => this.drawRect(p, snakeColor));
        this.drawRect(snake.head, snakeColor);
    }

    drawApple(apple) {
        if (apple) {
            this.drawRect(apple, 'rgb(79, 211, 68)');
        }
    }
    render(game) {
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        this.drawGameField();
        this.drawSnake(game.snake);
        this.drawApple(game.apple);
    };
}

/*--------------------------------------------------------*/



/*----------------  FPS-CONTROL --------------------------*/

class FpsCtrl {
    constructor(fps, cb) {
        this.delay = 1000 / fps;
        this.time = null;
        this.frame = -1;
        this.tref = null;
        this.cb = cb;
        this.isPlaying = false;
    }

    loop(timestamp) {
        if (!this.time) {
            this.time = timestamp;
        }
        const seq = Math.floor((timestamp - this.time) / this.delay);
        if (seq > this.frame) {
            this.frame = seq;
            this.cb({
                time: timestamp,
                frame: this.frame,
            });
        }
        this.tref = requestAnimationFrame((e) => this.loop(e))
    }

    start() {
        if (!this.isPlaying) {
            this.isPlaying = true;
            this.tref = requestAnimationFrame((e) => this.loop(e));
        }
    }

    pause() {
        if (this.isPlaying) {
            cancelAnimationFrame(this.tref);
            this.isPlaying = false;
            this.time = null;
            this.frame = -1;
        }
    }

    frameRate(newFps) {
        this.delay = 1000 / newFps;
        this.frame = -1;
        this.time = null;
    }
}
/*--------------------------------------------------------*/

function setListeners({ onKeyPress, onSpaceDown, onSpaceUp}) {
    document.addEventListener('keyup', e => {
        if (e.keyCode === 32) {
            onSpaceUp();
        }
    });
    document.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
            case 32: {
                return onSpaceDown();
            }
            case 37: {
                return onKeyPress(directions.LEFT);
            }
            case 38: {
                return onKeyPress(directions.UP);
            }
            case 39: {
                return onKeyPress(directions.RIGHT);
            }
            case 40: {
                return onKeyPress(directions.DOWN);
            }
            default:
                return;
        }
    });
}

function main() {
    const snakeRender = new SnakeRender('game', gameSize);
    const scoreEl = document.getElementById('score');
    let state = initialGameState;
    let isTravellingInPast = false;
    const setDirection = direction => {
        state.snake = changeDirection(state.snake, direction);
    };
    setListeners({
        onKeyPress: setDirection,
        onSpaceDown: () => { isTravellingInPast = true },
        onSpaceUp: () => { isTravellingInPast = false },
    });
    let { score } = state;
    let history = [state];
    const fps = new FpsCtrl(15, () => {
        if (!isTravellingInPast && !state.snake.hasGameOver) {
            state = gameTick(state);
            history.push(state);
        }
        if (isTravellingInPast) {
            const { history: newHistory, frame } = travelToPast(history);
            state = frame;
            history = newHistory;
        }
        snakeRender.render(state);
        if (score !== state.score) {
            score = state.score;
            scoreEl.innerHTML = state.score;
        }
    });
    fps.start();
}

document.addEventListener('DOMContentLoaded', main);
