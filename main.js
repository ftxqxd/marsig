const id = (x) => document.getElementById(x);

const cvs = id("cvs");
const ctx = cvs.getContext("2d");

// the order of these values is important!
const TILE_EMPTY = 0,
      TILE_AIR   = 1,
      TILE_FIRE  = 2
      TILE_WATER = 3,
      TILE_EARTH = 4,
      TILE_SALT  = 5,
      TILE_QUICKSILVER = 6,
      TILE_LEAD        = 7,
      TILE_TIN         = 8,
      TILE_IRON        = 9,
      TILE_COPPER      = 10,
      TILE_SILVER      = 11,
      TILE_GOLD        = 12,
      TILE_VITAE       = 13,
      TILE_MORS        = 14;

const SCALE = 60;

function draw_hexagon(ctx, x, y, size) {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + size*Math.sin(i*Math.PI/3), y + size*Math.cos(i*Math.PI/3));
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
}

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        let j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

function pick_random(budget) {
    let total = 0;
    for (let key in budget) {
        total += budget[key];
    }
    if (total <= 0) {
        return -1;
    }

    let x = Math.floor(Math.random() * total);
    for (let key in budget) {
        x -= budget[key];
        if (x < 0) {
            return key;
        }
    }

    return -1;
}

class Board {
    constructor() {
        this.generate();
    }

    generate() {
        this.tiles = [];
        for (let y = 0; y <= 12; y++) {
            let row = [];
            for (let x = 0; x <= 12; x++) {
                row.push(TILE_EMPTY);
            }
            this.tiles.push(row);
        }
        this.tiles[6][6] = TILE_GOLD;

        let positions = Board.board_positions();
        while (positions.length > 0) {
            let [row, col] = positions.pop();
            let tile = TILE_SALT;
            this.tiles[row][col] = tile;
        }

        let pairs = [];
        for (let i = 0; i < 27; i++) {
            let tiles = this.unlocked_tiles();
            for (let i = 0; i < tiles.length; i++) {
                if (tiles[i][0] == 6 && tiles[i][1] == 6) {
                    tiles.splice(i, 1);
                    break;
                }
            }
            if (tiles.length < 2) {
                // try again until this works
                return this.generate();
            }

            shuffle(tiles);
            let [[row1, col1], [row2, col2]] = [tiles.pop(), tiles.pop()];
            this.tiles[row1][col1] = TILE_EMPTY;
            this.tiles[row2][col2] = TILE_EMPTY;
            pairs.push([[row1, col1], [row2, col2]]);
        }

        let budget = {
            [TILE_AIR]:   4,
            [TILE_FIRE]:  4,
            [TILE_WATER]: 4,
            [TILE_EARTH]: 4,
            [TILE_SALT]:  2,
            [TILE_MORS]: 4,
            [TILE_QUICKSILVER]: 5,
        };

        let number_of_salt_matches = Math.floor(Math.random()*3);
        let salt_matches = [];
        for (let i = 0; i < number_of_salt_matches; i++) {
            let element = TILE_AIR + Math.floor(Math.random()*4);
            budget[element]--;
            budget[TILE_SALT]++;
            salt_matches.push(element);
            salt_matches.push(element);
        }
        for (let i = 0; i < 2 - number_of_salt_matches; i++) {
            salt_matches.push(TILE_SALT);
        }
        shuffle(salt_matches);

        let metal = TILE_LEAD;
        for (let pair_of_pairs of pairs) {
            shuffle(pair_of_pairs);
            let [[row1, col1], [row2, col2]] = pair_of_pairs;
            let match = +pick_random(budget);
            if (match == TILE_MORS) {
                this.tiles[row1][col1] = TILE_MORS;
                this.tiles[row2][col2] = TILE_VITAE;
            } else if (match == TILE_QUICKSILVER) {
                this.tiles[row1][col1] = TILE_QUICKSILVER;
                this.tiles[row2][col2] = metal;
                metal++;
            } else if (match == TILE_SALT) {
                let element = salt_matches.pop();
                this.tiles[row1][col1] = TILE_SALT;
                this.tiles[row2][col2] = element;
            } else {
                this.tiles[row1][col1] = match;
                this.tiles[row2][col2] = match;
            }
            budget[match]--;
        }
        this.next_metal = TILE_LEAD;
    }

    unlocked_tiles() {
        let tiles = [];
        for (let row = 1; row <= 11; row++) {
            let offset = Board.row_offset(row);
            for (let col = offset + 1; col <= offset + Board.row_size(row); col++) {
                if (this.tile_is_unlocked(row, col)) {
                    tiles.push([row, col]);
                }
            }
        }
        return tiles;
    }

    static board_positions() {
        let list = [];
        for (let row = 2; row <= 10; row++) {
            let offset = this.row_offset(row);
            for (let col = offset + 2; col <= offset + this.row_size(row) - 1; col++) {
                if (!(false
                    || row == 4 && col == 3
                    || row == 3 && col == 5
                    || row == 5 && col == 8
                    || row == 6 && col == 6
                    || row == 7 && col == 4
                    || row == 8 && col == 9
                    || row == 9 && col == 7
                )) {
                    list.push([row, col]);
                }
            }
        }
        return list;
    }

    tile_is_unlocked(row, col) {
        let tile = this.tiles[row][col];
        if (tile === TILE_EMPTY) {
            return false;
        }
        if (tile >= TILE_LEAD && tile <= TILE_GOLD && tile !== this.next_metal) {
            return false;
        }

        let neighbours = [
            [row - 1, col - 1],
            [row - 1, col],
            [row, col + 1],
            [row + 1, col + 1],
            [row + 1, col],
            [row, col - 1],
            // loop around
            [row - 1, col - 1],
            [row - 1, col],
        ];

        let count = 0;
        for (let [row2, col2] of neighbours) {
            let neighbour = this.tiles[row2][col2];
            if (neighbour === TILE_EMPTY) {
                count += 1;
                if (count >= 3) {
                    return true;
                }
            } else {
                count = 0;
            }
        }

        return false;
    }

    try_match(row1, col1, row2, col2) {
        let [tile1, tile2] = [this.tiles[row1][col1], this.tiles[row2][col2]];
        if (tile1 === tile2 && tile1 >= TILE_AIR && tile1 <= TILE_SALT) {
            this.tiles[row1][col1] = TILE_EMPTY;
            this.tiles[row2][col2] = TILE_EMPTY;
            return;
        }

        if (tile1 === TILE_QUICKSILVER || tile1 === TILE_MORS || tile1 === TILE_SALT) {
            [tile1, tile2] = [tile2, tile1];
        }

        if (tile2 === TILE_SALT && tile1 >= TILE_AIR && tile1 <= TILE_EARTH
         || tile1 === TILE_VITAE && tile2 === TILE_MORS) {
            this.tiles[row1][col1] = TILE_EMPTY;
            this.tiles[row2][col2] = TILE_EMPTY;
            return;
        }

        if (tile2 === TILE_QUICKSILVER && tile1 === this.next_metal) {
            this.next_metal++;
            this.tiles[row1][col1] = TILE_EMPTY;
            this.tiles[row2][col2] = TILE_EMPTY;
            return;
        }
    }

    static row_size(row) {
        if (row <= 0 || row > 11) {
            return 0;
        }

        if (row <= 6) {
            return row + 5;
        }

        return 17 - row;
    }

    static row_offset(row) {
        if (row <= 6) {
            return 0;
        } else {
            return row - 6;
        }
    }
}

class Game {
    constructor() {
        this.board = new Board();
        this.selected = null;
    }

    static tile_colour(tile) {
        switch (tile) {
            case TILE_EMPTY:
                return '#edc';
            case TILE_AIR:
                return '#88f';
            case TILE_FIRE:
                return '#f80';
            case TILE_WATER:
                return '#2dd';
            case TILE_EARTH:
                return '#3a3';
            case TILE_SALT:
            case TILE_QUICKSILVER:
                return '#dda';
            case TILE_MORS:
                return '#222';
            case TILE_VITAE:
                return '#daa';
            case TILE_LEAD:
                return '#446';
            case TILE_TIN:
                return '#886';
            case TILE_IRON:
                return '#866';
            case TILE_COPPER:
                return '#b94';
            case TILE_SILVER:
                return '#888';
            case TILE_GOLD:
                return '#da4';
            default:
                return '#000';
        }
    }

    static tile_symbol(tile) {
        switch (tile) {
            case TILE_EMPTY:
                return '';
            case TILE_AIR:
                return '🜁';
            case TILE_FIRE:
                return '🜂';
            case TILE_WATER:
                return '🜄';
            case TILE_EARTH:
                return '🜃';
            case TILE_SALT:
                return '🜔';
            case TILE_QUICKSILVER:
                return '☿';
            case TILE_MORS:
                return '🜞';
            case TILE_VITAE:
                return '🜍';
            case TILE_LEAD:
                return '♄';
            case TILE_TIN:
                return '♃';
            case TILE_IRON:
                return '♂';
            case TILE_COPPER:
                return '♀';
            case TILE_SILVER:
                return '☽';
            case TILE_GOLD:
                return '☉';
            default:
                return '';
        }
    }

    static game_to_screen(row, col) {
        let x = Math.round((col - row/2 + 3) * SCALE);
        let y = row * SCALE / 1.2;
        return [x, y];
    }

    static screen_to_game(x, y) {
        let row = Math.round(y/SCALE*1.2);
        let col = Math.round(x/SCALE + row/2) - 3;
        return [row, col];
    }

    draw(ctx) {
        ctx.clearRect(0, 0, cvs.width, cvs.height);
        for (let row = 1; row <= 11; row++) {
            let offset = Board.row_offset(row);
            for (let col = 1 + offset; col <= offset + Board.row_size(row); col++) {
                let tile = this.board.tiles[row][col];

                let [x, y] = Game.game_to_screen(row, col);
                ctx.strokeStyle = '#000';
                ctx.fillStyle = Game.tile_colour(tile);
                ctx.lineWidth = 1;
                draw_hexagon(ctx, x, y, SCALE / Math.sqrt(3));
                ctx.fillStyle = '#fff';
                ctx.font = "36px Symbola";
                ctx.fillText(Game.tile_symbol(tile), x - SCALE*0.2, y + SCALE*0.17);

                if (!this.board.tile_is_unlocked(row, col)) {
                    ctx.strokeStyle = 'rgba(0,0,0,0)';
                    ctx.fillStyle = 'rgba(255,255,255,0.7)';
                    draw_hexagon(ctx, x, y, SCALE / Math.sqrt(3));
                }
            }
        }

        if (this.selected !== null) {
            let [row, col] = this.selected;
            let [x, y] = Game.game_to_screen(row, col);
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#000';
            ctx.fillStyle = 'rgba(0,0,0,0)';
            draw_hexagon(ctx, x, y, SCALE / Math.sqrt(3));
        }
    }

    onclick(e) {
        let [x, y] = [e.pageX - cvs.offsetLeft, e.pageY - cvs.offsetTop];
        let [row, col] = Game.screen_to_game(x, y);
        this.select(row, col);

        this.draw(ctx);
    }

    select(row, col) {
        if (!this.board.tile_is_unlocked(row, col)) {
            this.selected = null;
            return;
        }
        if (this.selected === null) {
            if (this.board.tiles[row][col] === TILE_GOLD && this.board.next_metal === TILE_GOLD) {
                this.board.tiles[row][col] = TILE_EMPTY;
                return;
            }
            this.selected = [row, col];
            return;
        }
        let [row2, col2] = this.selected;
        if (row === row2 && col === col2) {
            this.selected = null;
            return;
        }
        this.board.try_match(row, col, row2, col2);
        this.selected = null;
    }
}

let game = new Game();
game.draw(ctx);
cvs.onclick = (e) => game.onclick(e);
