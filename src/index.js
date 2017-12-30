function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

const directions = {
    LEFT: 1,
    UP: 2,
    RIGHT: 3,
    DOWN: 4,
};

const oppositeDirection = (dir) => {
    switch (dir) {
        case directions.LEFT: return directions.RIGHT;
        case directions.RIGHT: return directions.LEFT;
        case directions.UP: return directions.DOWN;
        case directions.DOWN: return directions.UP;
        default: throw new Error('Invalid direction');
    }
};

const isVerticalDirection = (dir) => dir === directions.UP || dir === directions.DOWN;

const gameSize = {
    width: 40,
    height: 20,
};

const createPoint = (x, y) => ({ x, y });

const initialSnake = {
    length: 3,
    head: createPoint(10, 10),
    body: [createPoint(8, 10), createPoint(9, 10)],
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

const move = (s) => {
    const body = [...s.body.slice(1, s.body.length), createPoint(s.head.x, s.head.y)];
    switch (s.direction) {
        case directions.LEFT:
            return Object.assign({}, s, {
                head: createPoint(s.head.x - 1, s.head.y),
                body,
            });
        case directions.UP: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x, s.head.y - 1),
                body,
            });
        }
        case directions.RIGHT: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x + 1, s.head.y),
                body,
            });
        }
        case directions.DOWN: {
            return Object.assign({}, s, {
                head: createPoint(s.head.x, s.head.y + 1),
                body,
            });
        }
        default:
            return s;
    }
};

const checkBoundaries = (s, boundaries) => {
    const { x, y } = s.head;
    const didCollide = s.body.some(p => p.x === x && p.y === y);
    if (didCollide) {
        return Object.assign({}, s, {
            hasGameOver: didCollide,
        });
    }
    let newX = s.head.x;
    let newY = s.head.y;
    const { width, height } = boundaries;
    const isVerticalDir = isVerticalDirection(s.direction);
    if (x === 0 && !isVerticalDir && s.direction !== directions.RIGHT) {
        newX = width;
    } else if (x === width && !isVerticalDir && s.direction !== directions.LEFT) {
        newX = 0;
    }
    if (y === 0 && isVerticalDir && s.direction !== directions.DOWN) {
        newY = height;
    } else if (y === height && isVerticalDir && s.direction !== directions.UP) {
        newY = 0;
    }
    return move(Object.assign({}, s, {
        head: createPoint(newX, newY),
    }));
};

const createApple = (boundaries) => {
    const x = getRandomInt(1, boundaries.width - 1);
    const y = getRandomInt(1, boundaries.height - 1);
    return createPoint(x, y);
};

const eatApple = (s) => {
    const movedSnake = move(s);
    return Object.assign({}, s, {
        length: s.length + 1,
        head: createPoint(movedSnake.head.x, movedSnake.head.y),
        body: [s.body[s.body.length - 1], ...movedSnake.body],
    });
};

const isAppleExist = (apple) => apple.x !== -1 || apple.y !== -1;

const hasBeenAppleEaten = (s, a) => s.head.x === a.x && s.head.y === a.y;

const removeApple = () => createPoint(-1, -1);

const gameTick = (game) => {
    const hasApple = isAppleExist(game.apple);
    let newSnakeState = checkBoundaries(game.snake, game.boundaries);
    let newAppleState = game.apple;
    let newScore = game.score;
    const shouldAppleAppear = Math.random();
    if (!hasApple && shouldAppleAppear > 0.8) {
        newAppleState = createApple(game.boundaries);
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

    drawGameField(bgColor, linesColor) {
        const { ctx, canvas, cellSize } = this;
        const { width, height } = canvas;
        ctx.fillStyle = bgColor;
        ctx.strokeStyle = linesColor;
        for (let x = cellSize; x < width; x += cellSize) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }
        for (let y = cellSize; y < height; y += cellSize) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.stroke();
    }

    coordinatesToReal({x, y}) {
        const { cellSize } = this;
        return {
            x: x * cellSize,
            y: y * cellSize,
        };
    };

    drawRect(point, color = 'rgb(76, 50, 90)') {
        const { cellSize } = this;
        const { x, y } = this.coordinatesToReal(point);
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x, y, cellSize, cellSize);
    }

    drawSnake(snake) {
        snake.body.forEach(p => this.drawRect(p));
        this.drawRect(snake.head, 'rgb(65, 162, 168)');
    }

    drawApple(apple) {
        if (apple) {
            this.drawRect(apple, 'rgb(79, 211, 68)');
        }
    }
    render(game) {
        this.ctx.clearRect(0, 0, this.canvasSize.width, this.canvasSize.height);
        this.drawGameField('#fff', '#33333355');
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

function setListeners(onKeyPress) {
    document.addEventListener('keydown', (e) => {
        switch (e.keyCode) {
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
    let state = initialGameState;
    const setDirection = (direction) => {
        state.snake = changeDirection(state.snake, direction);
    };
    setListeners(setDirection);
    const fps = new FpsCtrl(15, () => {
        state = gameTick(state);
        snakeRender.render(state);
    });
    fps.start();
}

document.addEventListener('DOMContentLoaded', main);
