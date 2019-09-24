const id = (x) => document.getElementById(x);

const cvs = id("cvs");
const ctx = cvs.getContext("2d");

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
      TILE_GOLD        = 12;

const SCALE = 50;

function draw_hexagon(ctx, x, y, size) {
    ctx.save();
    ctx.fillStyle = '#000';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y + size);
    for (let i = 0; i < 6; i++) {
        ctx.lineTo(x + size*Math.sin(i*Math.PI/3), y + size*Math.cos(i*Math.PI/3));
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
}

class Board {
    constructor() {
        this.tiles = [];
        for (let y = 0; y <= 11; y++) {
            let row = [];
            for (let x = 0; x <= 11; x++) {
                row.push(TILE_EMPTY);
            }
            this.tiles.push(row);
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
        return (11 - this.row_size(row)) / 2;
    }

    draw(ctx) {
        for (let row = 1; row <= 11; row++) {
            for (let col = 1; col <= Board.row_size(row); col++) {
                let x = Math.round((Board.row_offset(row) + col) * SCALE * 1.18);
                let y = row * SCALE;
                draw_hexagon(ctx, x, y, SCALE / Math.sqrt(3));
            }
        }
    }
}

let b = new Board();
b.draw(ctx);
