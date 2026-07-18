// 2" Pond Venturi Aerator — single piece, parametric
// 9mm throat = ~6 m/s at 1,500 L/h
//
// Print: PA12-CF, 0.16mm layer, 280°C nozzle, tree supports

/* [Pipe Dimensions] */
PIPE_DIA = 50;          // mm — 2" pipe inner diameter
WALL = 3.5;             // mm — wall thickness (thinner than 110mm, less stress)
COUPLING_DEPTH = 40;    // mm — how far the pipe inserts

/* [Venturi Geometry] */
THROAT_DIA = 9;         // mm — 9mm for 6 m/s at 1,500 L/h
CONVERGE_ANGLE = 21;    // degrees
DIVERGE_ANGLE = 7;      // degrees
STRAIGHT_SECTION = 8;   // mm — straight at throat

/* [Air Intake] */
AIR_DIA = 6;            // mm — 6mm barb for silicone hose
AIR_BARB_LENGTH = 18;   // mm

/* [Resolution] */
$fn = 64;

INNER_R = PIPE_DIA / 2;
OUTER_R = INNER_R + WALL;
THROAT_R = THROAT_DIA / 2;

converge_len = (INNER_R - THROAT_R) / tan(CONVERGE_ANGLE);
diverge_len = (INNER_R - THROAT_R) / tan(DIVERGE_ANGLE);
total_len = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION + diverge_len + COUPLING_DEPTH;

echo(str("2\" venturi total length: ", total_len, "mm"));
echo(str("Fits bed: ", total_len < 380, ""));

module venturi_body() {
    rotate([-90, 0, 0]) {
        cylinder(h=COUPLING_DEPTH, r=OUTER_R);
        translate([0, 0, COUPLING_DEPTH]) {
            cylinder(h=converge_len, r1=OUTER_R, r2=THROAT_R + WALL);
            translate([0, 0, converge_len]) {
                cylinder(h=STRAIGHT_SECTION, r=THROAT_R + WALL);
                translate([0, 0, STRAIGHT_SECTION]) {
                    cylinder(h=diverge_len, r1=THROAT_R + WALL, r2=OUTER_R);
                    translate([0, 0, diverge_len]) {
                        cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                    }
                }
            }
        }
    }
}

module interior() {
    rotate([-90, 0, 0]) {
        cylinder(h=COUPLING_DEPTH, r=INNER_R);
        translate([0, 0, COUPLING_DEPTH]) {
            cylinder(h=converge_len, r1=INNER_R, r2=THROAT_R);
            translate([0, 0, converge_len]) {
                cylinder(h=STRAIGHT_SECTION, r=THROAT_R);
                translate([0, 0, STRAIGHT_SECTION]) {
                    cylinder(h=diverge_len, r1=THROAT_R, r2=INNER_R);
                    translate([0, 0, diverge_len]) {
                        cylinder(h=COUPLING_DEPTH + 1, r=INNER_R);
                    }
                }
            }
        }
    }
}

module air_barb() {
    barb_z = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION / 2;
    translate([0, OUTER_R, barb_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2]) {
        cylinder(h=AIR_BARB_LENGTH, r=AIR_DIA/2 + WALL/2);
        translate([0, 0, AIR_BARB_LENGTH - 3]) {
            cylinder(h=3, r=AIR_DIA/2 + WALL);
        }
    }
}

module air_barb_hollow() {
    barb_z = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION / 2;
    translate([0, OUTER_R, barb_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2]) {
        cylinder(h=AIR_BARB_LENGTH + 5, r=AIR_DIA/2);
    }
    translate([0, 0, barb_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2 - 2]) {
        rotate([-90, 0, 0]) {
            cylinder(h=OUTER_R * 3, r=AIR_DIA/2);
        }
    }
}

difference() {
    venturi_body();
    interior();
    air_barb_hollow();
}
air_barb();
