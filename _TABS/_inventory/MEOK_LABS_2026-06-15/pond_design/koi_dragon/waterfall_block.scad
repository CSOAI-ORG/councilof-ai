// WATERFALL WALL BLOCK — modular, single-piece, 370mm wide
// Each block stacks to form a 200mm tall layer of the waterfall wall
// Dovetail interlocks on top/bottom for stacking
// Water flows over the front spillway lip
// Back has a recessed water channel that distributes to the top block

// Print: PLA or PETG (no structural load), 0.2mm layer, NO supports needed

/* [Block Dimensions] */
BLOCK_W = 370;          // mm — max single-piece on 392mm bed
BLOCK_H = 200;          // mm — height per block
BLOCK_D = 150;          // mm — depth front-to-back
WALL = 3;               // mm — wall thickness

/* [Spillway] */
SPILL_ANGLE = 20;       // degrees — how far the spillway lip angles forward
LIP_RADIUS = 8;         // mm — rounded lip for smooth water flow
WATER_GUIDE_DEPTH = 5;  // mm — shallow grooves on spillway to guide water evenly

/* [Interlock] */
DOVETAIL_WIDTH = 30;    // mm — dovetail slot width
DOVETAIL_DEPTH = 10;    // mm — depth of interlock

$fn = 32;

// The block body
module block_body() {
    // Main body
    cube([BLOCK_W, BLOCK_D, BLOCK_H]);
    
    // Spillway front face — angled slightly forward
    // This is where water cascades over
    translate([0, BLOCK_D, 0]) {
        rotate([SPILL_ANGLE, 0, 0]) {
            cube([BLOCK_W, 20, BLOCK_H]);
        }
    }
    
    // Water guide grooves on the spillway face
    // These channels keep the water spread evenly across the full width
    for (x = [10: 20: BLOCK_W - 10]) {
        translate([x, BLOCK_D - 2, 0]) {
            cube([1, 4, BLOCK_H]);
        }
    }
}

// Dovetail male (top) — slots into the block above
module dovetail_male() {
    for (x = [(BLOCK_W/4): (BLOCK_W/2): (BLOCK_W * 3/4)]) {
        translate([x, BLOCK_D/2 - DOVETAIL_WIDTH/2, BLOCK_H]) {
            rotate([90, 0, 0]) {
                linear_extrude(height=DOVETAIL_WIDTH) {
                    polygon(points=[
                        [0, 0],
                        [DOVETAIL_DEPTH, -WALL],
                        [DOVETAIL_DEPTH, DOVETAIL_WIDTH + WALL],
                        [0, DOVETAIL_WIDTH + WALL*2],
                    ]);
                }
            }
        }
    }
}

// Dovetail female (bottom)
module dovetail_female() {
    for (x = [(BLOCK_W/4): (BLOCK_W/2): (BLOCK_W * 3/4)]) {
        translate([x, BLOCK_D/2 - DOVETAIL_WIDTH/2, -1]) {
            rotate([90, 0, 0]) {
                linear_extrude(height=DOVETAIL_WIDTH) {
                    polygon(points=[
                        [0, -1],
                        [-DOVETAIL_DEPTH - 1, -WALL - 2],
                        [-DOVETAIL_DEPTH - 1, DOVETAIL_WIDTH + WALL + 2],
                        [0, DOVETAIL_WIDTH + WALL*2 + 1],
                    ]);
                }
            }
        }
    }
}

// Water channel on the back — water flows up through this
module back_water_channel() {
    // Vertical distribution channel — centered on the back face
    channel_w = 40;
    channel_d = 15;
    translate([BLOCK_W/2 - channel_w/2, -channel_d, 0]) {
        cube([channel_w, channel_d, BLOCK_H]);
    }
    
    // Top manifold slot — distributes water across the top
    // Water enters here from the block below, then spills over the front
    translate([-WALL, -channel_d, BLOCK_H - 10]) {
        cube([BLOCK_W + WALL*2, channel_d + BLOCK_D + 1, 10]);
    }
    
    // Small distribution channels at the top — spread water evenly
    for (x = [0: 20: BLOCK_W]) {
        translate([x, -channel_d - 5, BLOCK_H - 12]) {
            cube([1, 5, 12]);
        }
    }
}

// Assembly
difference() {
    union() {
        block_body();
        dovetail_male();
    }
    dovetail_female();
    back_water_channel();
}

echo(str("Block: ", BLOCK_W, "×", BLOCK_D, "×", BLOCK_H, "mm — fits bed: ", BLOCK_W < 392));
