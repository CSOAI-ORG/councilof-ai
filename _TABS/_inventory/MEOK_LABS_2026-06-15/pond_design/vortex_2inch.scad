// VORTEX VENTURI 2" — tangential inlet, cyclone aeration
// Same vortex design as 110mm version but scaled for 2" pipe
//
// Single piece, fits Qidi Max4 easily
// Print: PA12-CF, 0.16mm layer, 280°C

/* [Pipe Dimensions] */
PIPE_DIA = 50;          // mm — 2" pipe inner diameter
WALL = 3.5;             // mm
COUPLING_DEPTH = 35;    // mm

/* [Vortex Chamber] */
CHAMBER_DIA = 90;       // mm — vortex cylinder (≈1.8× pipe)
CHAMBER_HEIGHT = 60;    // mm

/* [Throat & Diffuser] */
THROAT_DIA = 9;         // mm — 9mm = 6 m/s at 1,500 L/h
CONVERGE_ANGLE = 30;    // degrees
DIVERGE_ANGLE = 7;      // degrees

/* [Air Intake] */
AIR_DIA = 6;            // mm — air hose barb
AIR_BARB_LENGTH = 20;   // mm

$fn = 64;

INNER_R = PIPE_DIA / 2;
OUTER_R = INNER_R + WALL;
CHAMBER_R = CHAMBER_DIA / 2;
THROAT_R = THROAT_DIA / 2;

module vortex_body() {
    // Main vortex cylinder
    cylinder(h=CHAMBER_HEIGHT, r=CHAMBER_R);
    translate([0, 0, CHAMBER_HEIGHT]) {
        cylinder(h=WALL, r=CHAMBER_R);
    }
    // Bottom converging cone into throat
    translate([0, 0, 0]) {
        converge_h = (CHAMBER_R - THROAT_R - WALL) / tan(CONVERGE_ANGLE);
        cylinder(h=converge_h, r1=CHAMBER_R, r2=THROAT_R + WALL);
        translate([0, 0, converge_h]) {
            cylinder(h=8, r=THROAT_R + WALL);
            translate([0, 0, 8]) {
                diverge_h = (INNER_R - THROAT_R) / tan(DIVERGE_ANGLE);
                cylinder(h=diverge_h, r1=THROAT_R + WALL, r2=OUTER_R);
                translate([0, 0, diverge_h]) {
                    cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                }
            }
        }
    }
}

module vortex_hollow() {
    translate([0, 0, 0]) {
        cylinder(h=CHAMBER_HEIGHT, r=CHAMBER_R - WALL);
    }
    translate([0, 0, 0]) {
        converge_h = (CHAMBER_R - THROAT_R - WALL) / tan(CONVERGE_ANGLE);
        cylinder(h=converge_h, r1=CHAMBER_R - WALL, r2=THROAT_R);
        translate([0, 0, converge_h]) {
            cylinder(h=8, r=THROAT_R);
            translate([0, 0, 8]) {
                diverge_h = (INNER_R - THROAT_R) / tan(DIVERGE_ANGLE);
                cylinder(h=diverge_h, r1=THROAT_R, r2=INNER_R);
                translate([0, 0, diverge_h]) {
                    cylinder(h=COUPLING_DEPTH + 1, r=INNER_R);
                }
            }
        }
    }
}

module tangential_inlet() {
    inlet_z = CHAMBER_HEIGHT * 0.7;
    translate([0, CHAMBER_R, inlet_z]) {
        rotate([0, 90, 0]) {
            cylinder(h=COUPLING_DEPTH + CHAMBER_R, r=OUTER_R);
        }
    }
}

module tangential_inlet_hollow() {
    inlet_z = CHAMBER_HEIGHT * 0.7;
    translate([0, CHAMBER_R, inlet_z]) {
        rotate([0, 90, 0]) {
            cylinder(h=COUPLING_DEPTH + CHAMBER_R + 1, r=INNER_R);
        }
    }
}

module air_intake() {
    translate([0, 0, CHAMBER_HEIGHT]) {
        cylinder(h=AIR_BARB_LENGTH, r=AIR_DIA/2 + WALL/2);
        translate([0, 0, AIR_BARB_LENGTH - 3]) {
            cylinder(h=3, r=AIR_DIA/2 + WALL);
        }
    }
    translate([0, 0, CHAMBER_HEIGHT - WALL/2]) {
        cylinder(h=AIR_BARB_LENGTH + WALL, r=AIR_DIA/2);
    }
}

difference() {
    union() {
        vortex_body();
        tangential_inlet();
        air_intake();
    }
    vortex_hollow();
    tangential_inlet_hollow();
    translate([0, 0, CHAMBER_HEIGHT - WALL/2]) {
        cylinder(h=AIR_BARB_LENGTH + WALL, r=AIR_DIA/2);
    }
}

echo(str("Vortex chamber: ", CHAMBER_DIA, "mm dia, throat: ", THROAT_DIA, "mm"));
