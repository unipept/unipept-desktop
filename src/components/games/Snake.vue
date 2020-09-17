<template>
    <p v-if="!snakeActive">
        Is this taking too long? <a @click="activateSnake">Play a game</a> while you're waiting 😉
    </p>
    <v-container v-else>
        <v-row>
            <v-col sm="12" md="12" lg="6">
                <div class="flex-grow-1 d-flex flex-column mr-8">
                    <h2 class="align-self-start">Snake</h2>
                    <div class="d-flex flex-row justify-space-between">
                        <h3>Current score</h3>
                        <h3>{{ snake.maxCells }}</h3>
                    </div>
                    <h3 class="align-self-start mt-8">Controls</h3>
                    <p class="align-self-start" style="text-align: left;">
                        Use the arrow keys on your keyboard to move around and try to eat the apple, without biting your own
                        tale.
                    </p>
                    <div>
                        <v-btn class="ma-1" depressed @click="moveUp()">
                            <v-icon dark>mdi-chevron-up</v-icon>
                        </v-btn>
                    </div>
                    <div>
                        <v-btn class="ma-1" depressed @click="moveLeft()">
                            <v-icon dark>mdi-chevron-left</v-icon>
                        </v-btn>
                        <v-btn class="ma-1" depressed @click="moveDown()">
                            <v-icon dark>mdi-chevron-down</v-icon>
                        </v-btn>
                        <v-btn class="ma-1" depressed @click="moveRight()">
                            <v-icon dark>mdi-chevron-right</v-icon>
                        </v-btn>
                    </div>
                </div>
            </v-col>
            <v-col sm="12" md="12" lg="6">
                <canvas
                    width="400"
                    height="400"
                    ref="snake"
                    class="snake-canvas">
                </canvas>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Watch } from "vue-property-decorator";

export type CellType = {
    x: number,
    y: number
}

@Component
export default class Snake extends Vue {
    private snakeActive: boolean = false;

    private canvas: HTMLCanvasElement;
    private context: CanvasRenderingContext2D;

    private grid = 16;
    private count = 0;

    private snake: {x: number, y: number, dx: number, dy: number, cells: CellType[], maxCells: number} = {
        x: 160,
        y: 160,

        // snake velocity. moves one grid length every frame in either the x or y direction
        dx: this.grid,
        dy: 0,

        // keep track of all grids the snake body occupies
        cells: [],

        // length of the snake. grows when eating an apple
        maxCells: 4
    };

    private apple = {
        x: 320,
        y: 320
    };

    mounted() {
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft") {
                this.moveLeft();
            } else if (e.key === "ArrowUp") {
                this.moveUp()
            } else if (e.key === "ArrowRight") {
                this.moveRight();
            } else if (e.key === "ArrowDown") {
                this.moveDown();
            }
        });
    }


    private async activateSnake(): Promise<void> {
        this.snakeActive = true;

        await this.$nextTick();

        this.canvas = this.$refs.snake as HTMLCanvasElement;
        this.context = this.canvas.getContext("2d");
        requestAnimationFrame(this.loop);
    }

    // get random whole numbers in a specific range
    // @see https://stackoverflow.com/a/1527820/2124254
    private getRandomInt(min: number, max: number) {
        return Math.floor(Math.random() * (max - min)) + min;
    }

    // game loop
    private loop() {
        requestAnimationFrame(this.loop);

        // slow game loop to 15 fps instead of 60 (60/15 = 4)
        if (++this.count < 4) {
            return;
        }

        this.count = 0;
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // move snake by it's velocity
        this.snake.x += this.snake.dx;
        this.snake.y += this.snake.dy;

        // wrap snake position horizontally on edge of screen
        if (this.snake.x < 0) {
            this.snake.x = this.canvas.width - this.grid;
        } else if (this.snake.x >= this.canvas.width) {
            this.snake.x = 0;
        }

        // wrap snake position vertically on edge of screen
        if (this.snake.y < 0) {
            this.snake.y = this.canvas.height - this.grid;
        } else if (this.snake.y >= this.canvas.height) {
            this.snake.y = 0;
        }

        // keep track of where snake has been. front of the array is always the head
        this.snake.cells.unshift({ x: this.snake.x, y: this.snake.y });

        // remove cells as we move away from them
        if (this.snake.cells.length > this.snake.maxCells) {
            this.snake.cells.pop();
        }

        // draw apple
        this.context.fillStyle = "red";
        this.context.fillRect(this.apple.x, this.apple.y, this.grid - 1, this.grid - 1);

        // draw snake one cell at a time
        this.context.fillStyle = "green";
        this.snake.cells.forEach((cell, index) => {

            // drawing 1 px smaller than the grid creates a grid effect in the snake body so you can see how long it is
            this.context.fillRect(cell.x, cell.y, this.grid - 1, this.grid - 1);

            // snake ate apple
            if (cell.x === this.apple.x && cell.y === this.apple.y) {
                this.snake.maxCells++;

                // canvas is 400x400 which is 25x25 grids
                this.apple.x = this.getRandomInt(0, 25) * this.grid;
                this.apple.y = this.getRandomInt(0, 25) * this.grid;
            }

            // check collision with all cells after this one (modified bubble sort)
            for (let i = index + 1; i < this.snake.cells.length; i++) {

                // snake occupies same space as a body part. reset game
                if (cell.x === this.snake.cells[i].x && cell.y === this.snake.cells[i].y) {
                    this.snake.x = 160;
                    this.snake.y = 160;
                    this.snake.cells = [];
                    this.snake.maxCells = 4;
                    this.snake.dx = this.grid;
                    this.snake.dy = 0;

                    this.apple.x = this.getRandomInt(0, 25) * this.grid;
                    this.apple.y = this.getRandomInt(0, 25) * this.grid;
                }
            }
        });
    }

    private moveLeft() {
        if (this.snake.dx === 0) {
            this.snake.dx = -this.grid;
            this.snake.dy = 0;
        }
    }

    private moveRight() {
        if (this.snake.dx === 0) {
            this.snake.dx = this.grid;
            this.snake.dy = 0;
        }
    }

    private moveUp() {
        if (this.snake.dy === 0) {
            this.snake.dy = -this.grid;
            this.snake.dx = 0;
        }
    }

    private moveDown() {
        if (this.snake.dy === 0) {
            this.snake.dy = this.grid;
            this.snake.dx = 0;
        }
    }
}
</script>

<style scoped>
    .snake-canvas {
        border: gray 1px solid;
    }
</style>
