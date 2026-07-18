// 110mm Pond Venturi Aerator — single piece, fits Qidi Max4
// Parametric. Change THROAT_DIA to tune aeration vs back-pressure.
// 15mm throat = ~6 m/s at 3,750 L/h
//
// Print: PA12-CF, 0.16mm layer, 280°C, tree supports for air barb

/* [Pipe Dimensions] */
PIPE_DIA = 110;         // mm — inner diameter of your pipe
WALL = 4;               // mm — wall thickness
COUPLING_DEPTH = 50;    // mm — how far the pipe inserts

/* [Venturi Geometry] */
THROAT_DIA = 15;        // mm — 15mm for 6 m/s at 3,750 L/h
CONVERGE_ANGLE = 21;    // degrees — optimal for liquid venturi
DIVERGE_ANGLE = 7;      // degrees — prevents flow separation
STRAIGHT_SECTION = 10;  // mm — straight section at throat before diverging

/* [Air Intake] */
AIR_DIA = 8;            // mm — inner diameter for air hose barb
AIR_BARB_LENGTH = 20;   // mm — how far the barb sticks out

/* [Resolution] */
$fn = 64;               // smooth curves

// Derived dimensions
INNER_R = PIPE_DIA / 2;
OUTER_R = INNER_R + WALL;
THROAT_R = THROAT_DIA / 2;

// Calculate lengths
converge_len = (INNER_R - THROAT_R) / tan(CONVERGE_ANGLE);
diverge_len = (INNER_R - THROAT_R) / tan(DIVERGE_ANGLE);
total_len = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION + diverge_len + COUPLING_DEPTH;

echo(str("Total length: ", total_len, "mm"));
echo(str("Fits bed: ", total_len < 380, " (bed diagonal=", sqrt(350*350+380*380), "mm)"));

// Main body
module venturi_body() {
    rotate([-90, 0, 0]) {
        // Inlet coupling
        cylinder(h=COUPLING_DEPTH, r=OUTER_R);
        translate([0, 0, COUPLING_DEPTH]) {
            // Converging section
            cylinder(h=converge_len, r1=OUTER_R, r2=THROAT_R + WALL);
            translate([0, 0, converge_len]) {
                // Throat section
                cylinder(h=STRAIGHT_SECTION, r=THROAT_R + WALL);
                translate([0, 0, STRAIGHT_SECTION]) {
                    // Diverging section
                    cylinder(h=diverge_len, r1=THROAT_R + WALL, r2=OUTER_R);
                    translate([0, 0, diverge_len]) {
                        // Outlet coupling
                        cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                    }
                }
            }
        }
    }
}

// Hollow interior (subtracted)
module interior() {
    rotate([-90, 0, 0]) {
        // Inlet hollow
        cylinder(h=COUPLING_DEPTH, r=INNER_R);
        translate([0, 0, COUPLING_DEPTH]) {
            // Converging hollow
            cylinder(h=converge_len, r1=INNER_R, r2=THROAT_R);
            translate([0, 0, converge_len]) {
                // Throat hollow
                cylinder(h=STRAIGHT_SECTION, r=THROAT_R);
                translate([0, 0, STRAIGHT_SECTION]) {
                    // Diverging hollow
                    cylinder(h=diverge_len, r1=THROAT_R, r2=INNER_R);
                    translate([0, 0, diverge_len]) {
                        // Outlet hollow
                        cylinder(h=COUPLING_DEPTH, r=INNER_R);
                    }
                }
            }
        }
    }
}

// Air intake barb
module air_barb() {
    // Position at throat, perpendicular to flow
    // The throat is at Z = COUPLING_DEPTH + converge_len in the rotated frame
    barb_base_z = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION / 2;
    translate([0, OUTER_R, barb_base_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2]) {
        // Barb stem
        cylinder(h=AIR_BARB_LENGTH, r=AIR_DIA/2 + WALL/2);
        // Barb barb (ridge for hose retention)
        translate([0, 0, AIR_BARB_LENGTH - 3]) {
            cylinder(h=3, r=AIR_DIA/2 + WALL);
        }
        // Hollow through the barb
        // (we'll subtract this)
    }
}

module air_barb_hollow() {
    // Same position, just the hole
    barb_base_z = COUPLING_DEPTH + converge_len + STRAIGHT_SECTION / 2;
    translate([0, OUTER_R, barb_base_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2]) {
        cylinder(h=AIR_BARB_LENGTH + 5, r=AIR_DIA/2);
    }
    // Hole through the venturi wall at throat
    translate([0, 0, barb_base_z - COUPLING_DEPTH - converge_len - STRAIGHT_SECTION / 2 - 2]) {
        rotate([-90, 0, 0]) {
            cylinder(h=OUTER_R * 2, r=AIR_DIA/2);
        }
    }
}

// Final model
difference() {
    venturi_body();
    interior();
    air_barb_hollow();
}

// Show the air barb (additive — it's outside the main body)
air_barb();

// Some visual text for the STL filename
// (OpenSCAD doesn't support text in 3D easily, so we skip marking)
