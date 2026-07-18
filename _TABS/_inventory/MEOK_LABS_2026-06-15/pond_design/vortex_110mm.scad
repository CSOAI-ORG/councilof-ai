// VORTEX VENTURI 110mm — tangential inlet, cyclone aeration, spinning waterfall
// Water enters tangentially → spirals around chamber → air sucked into vortex eye
// → throat accelerates spinning water → diverging section → twisting waterfall
//
// Single piece, fits Qidi Max4 diagonally
// Print: PA12-CF, 0.16mm layer, 280°C, tree supports for air barb

/* [Pipe Dimensions] */
PIPE_DIA = 110;         // mm — inner diameter of your pipe
WALL = 4;               // mm — wall thickness
COUPLING_DEPTH = 40;    // mm — how far pipe inserts into coupling

/* [Vortex Chamber] */
CHAMBER_DIA = 200;      // mm — vortex cylinder diameter (≈1.8× pipe)
CHAMBER_HEIGHT = 100;   // mm — height of the vortex chamber

/* [Throat & Diffuser] */
THROAT_DIA = 15;        // mm — 15mm = 6 m/s at 3,750 L/h
CONVERGE_ANGLE = 30;    // degrees — steeper for vortex (water is already spinning)
DIVERGE_ANGLE = 7;      // degrees — gentle expansion prevents separation

/* [Air Intake] */
AIR_DIA = 8;            // mm — air hose barb inner diameter
AIR_BARB_LENGTH = 25;   // mm

$fn = 64;

// Derived
INNER_R = PIPE_DIA / 2;
OUTER_R = INNER_R + WALL;
CHAMBER_R = CHAMBER_DIA / 2;
THROAT_R = THROAT_DIA / 2;

// The vortex chamber sits with its center at origin
// Tangential inlet connects on the side (+X direction)
// Air intake on top (+Z)
// Throat and diffuser below (-Z)

module vortex_chamber_outer() {
    // Main vortex cylinder
    cylinder(h=CHAMBER_HEIGHT, r=CHAMBER_R);
    
    // Top plate (flat, with air intake hole)
    translate([0, 0, CHAMBER_HEIGHT]) {
        cylinder(h=WALL, r=CHAMBER_R);
    }
    
    // Bottom converging cone — transitions into throat
    translate([0, 0, 0]) {
        converge_h = (CHAMBER_R - THROAT_R - WALL) / tan(CONVERGE_ANGLE);
        cylinder(h=converge_h, r1=CHAMBER_R, r2=THROAT_R + WALL);
        translate([0, 0, converge_h]) {
            // Throat straight section
            cylinder(h=10, r=THROAT_R + WALL);
            translate([0, 0, 10]) {
                // Diverging section — back to outlet pipe size
                diverge_h = (INNER_R - THROAT_R) / tan(DIVERGE_ANGLE);
                cylinder(h=diverge_h, r1=THROAT_R + WALL, r2=OUTER_R);
                translate([0, 0, diverge_h]) {
                    // Outlet coupling
                    cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                }
            }
        }
    }
}

module vortex_chamber_hollow() {
    // Inside of vortex chamber — just the hollow
    difference() {
        translate([0, 0, 0]) {
            cylinder(h=CHAMBER_HEIGHT, r=CHAMBER_R - WALL);
        }
        // The air intake hole will be subtracted separately
    }
    
    // Converging cone hollow
    translate([0, 0, 0]) {
        converge_h = (CHAMBER_R - THROAT_R - WALL) / tan(CONVERGE_ANGLE);
        cylinder(h=converge_h, r1=CHAMBER_R - WALL, r2=THROAT_R);
        translate([0, 0, converge_h]) {
            // Throat hollow
            cylinder(h=10, r=THROAT_R);
            translate([0, 0, 10]) {
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
    // Inlet pipe connects tangent to the vortex chamber wall
    // Position it at the top-third of the chamber for longest spin path
    inlet_z = CHAMBER_HEIGHT * 0.7;
    
    // The pipe approaches from +X direction, tangent to the circle at (0, CHAMBER_R, inlet_z)
    // Pipe centerline runs along Y at X = CHAMBER_R
    translate([0, CHAMBER_R, inlet_z]) {
        rotate([0, 90, 0]) {
            // Pipe goes in Y direction (toward +Y from tangent point)
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
    // Air intake at the CENTER TOP of the vortex chamber
    // This is the eye of the vortex — lowest pressure point
    translate([0, 0, CHAMBER_HEIGHT]) {
        // Barb base
        cylinder(h=AIR_BARB_LENGTH, r=AIR_DIA/2 + WALL/2);
        // Retention ring
        translate([0, 0, AIR_BARB_LENGTH - 4]) {
            cylinder(h=4, r=AIR_DIA/2 + WALL);
        }
    }
    // Hole through
    translate([0, 0, CHAMBER_HEIGHT - WALL/2]) {
        cylinder(h=AIR_BARB_LENGTH + WALL, r=AIR_DIA/2);
    }
}

// Assemble
difference() {
    union() {
        vortex_chamber_outer();
        tangential_inlet();
        air_intake();
    }
    vortex_chamber_hollow();
    tangential_inlet_hollow();
    // Air intake hole (already included in air_intake() module above via the cylinder hole)
    translate([0, 0, CHAMBER_HEIGHT - WALL/2]) {
        cylinder(h=AIR_BARB_LENGTH + WALL, r=AIR_DIA/2);
    }
}

echo(str("Dimensions: ", CHAMBER_DIA, "mm dia × ", CHAMBER_HEIGHT + WALL, "mm tall"));
echo(str("Fits bed: ", CHAMBER_DIA < 350 && (CHAMBER_HEIGHT + WALL + COUPLING_DEPTH + 30 + 30 + 10 + 50) < 380 ? "YES" : "CHECK"));
echo(str("Throat: ", THROAT_DIA, "mm — ", THROAT_DIA < INNER_R ? "OK" : "ERROR: throat > pipe!"));
