// Air Distribution Manifold — single piece, 7 outlets
// Mounts above water level. All 7 venturis draw air from here.
// Single atmospheric intake with bug mesh.
//
// Print: PETG or PLA (no water pressure), 0.2mm layer

/* [Chamber] */
CHAMBER_DIA = 160;      // mm — outer diameter of the air chamber
CHAMBER_HEIGHT = 80;    // mm — height
WALL = 2.5;             // mm

/* [Outlets] */
OUTLET_COUNT = 7;       // 2× 8mm + 5× 6mm
OUTLET_LARGE = 8;       // mm — for 110mm venturis
OUTLET_SMALL = 6;       // mm — for 2" venturis
OUTLET_LENGTH = 25;     // mm — barb length

/* [Inlet] */
INLET_DIA = 20;         // mm — main air intake (with bug mesh)
INLET_LENGTH = 30;

$fn = 48;

INNER_R = CHAMBER_DIA / 2;
OUTER_R = INNER_R + WALL;

module chamber() {
    difference() {
        // Outer cylinder
        cylinder(h=CHAMBER_HEIGHT, r=OUTER_R);
        // Hollow inside
        translate([0, 0, WALL]) {
            cylinder(h=CHAMBER_HEIGHT - WALL*2, r=INNER_R);
        }
    }
}

module air_inlet() {
    // On top of chamber
    translate([0, 0, CHAMBER_HEIGHT]) {
        cylinder(h=INLET_LENGTH, r=INLET_DIA/2 + WALL);
        translate([0, 0, -2]) {
            cylinder(h=2, r=INLET_DIA/2 + WALL + 2);  // flange
        }
    }
    // Hole through
    translate([0, 0, CHAMBER_HEIGHT - 1]) {
        cylinder(h=INLET_LENGTH + 2, r=INLET_DIA/2);
    }
}

module outlet_barb(angle, is_large) {
    dia = is_large ? OUTLET_LARGE : OUTLET_SMALL;
    r_pos = INNER_R * 0.7;
    translate([r_pos * cos(angle), r_pos * sin(angle), WALL/2]) {
        rotate([0, 0, angle]) {
            rotate([90, 0, 0]) {
                cylinder(h=OUTLET_LENGTH, r=dia/2 + WALL);
                translate([0, 0, OUTLET_LENGTH - 3]) {
                    cylinder(h=3, r=dia/2 + WALL + 1);
                }
            }
        }
    }
    // Hole through chamber wall
    r_pos2 = INNER_R * 0.5;
    translate([r_pos2 * cos(angle), r_pos2 * sin(angle), WALL/2]) {
        rotate([0, 0, angle]) {
            rotate([90, 0, 0]) {
                cylinder(h=OUTER_R - r_pos2 + OUTLET_LENGTH, r=dia/2);
            }
        }
    }
}

// Build
union() {
    chamber();
    air_inlet();
    
    // 2 large outlets for 110mm venturis
    outlet_barb(0, true);
    outlet_barb(180, true);
    
    // 5 small outlets for 2" venturis
    for (i = [0:4]) {
        outlet_barb(45 + i * 72, false);
    }
}
