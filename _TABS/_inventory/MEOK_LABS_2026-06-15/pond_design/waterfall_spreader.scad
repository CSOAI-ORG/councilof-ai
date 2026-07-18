// Waterfall Fan Spreader — single piece, 300mm wide, fits Qidi Max4
// Converts 110mm pipe flow into a wide thin sheet
//
// Print: PA12-CF, 0.2mm layer, 280°C, no supports needed (print flat)

/* [Pipe Connection] */
INLET_DIA = 110;        // mm — matches venturi outlet
COUPLING_DEPTH = 40;    // mm
WALL = 3.5;             // mm

/* [Spreader Geometry] */
SPREAD_WIDTH = 370;     // mm — max single-piece on Qidi Max4 (392mm X limit)
GAP = 6;                // mm — slot opening (6mm = visible sheet + good aeration)
LIP_ANGLE = 15;         // degrees — downward angle to prevent wind blow-back
TRANSITION_LENGTH = 80; // mm — round-to-slot transition length

/* [Cosmetic] */
NOTCH_SPACING = 20;     // mm — V-notches along the lip for visual effect
NOTCH_DEPTH = 3;        // mm

$fn = 48;

INNER_R = INLET_DIA / 2;
OUTER_R = INNER_R + WALL;

// Round inlet → rectangular slot transition
module spreader() {
    difference() {
        union() {
            // Inlet tube
            translate([-SPREAD_WIDTH/2, 0, 0]) {
                rotate([0, 90, 0]) {
                    cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                }
            }
            
            // Transition box: round at inlet → slot at outlet
            translate([-SPREAD_WIDTH/2, 0, COUPLING_DEPTH]) {
                // Main transition body
                hull() {
                    // Inlet: round shape
                    translate([0, 0, 0]) {
                        rotate([0, 90, 0]) {
                            cylinder(h=1, r=OUTER_R);
                        }
                    }
                    // Outlet: rectangular slot
                    translate([TRANSITION_LENGTH, 0, 0]) {
                        cube([1, SPREAD_WIDTH, GAP + WALL*2], center=true);
                    }
                }
                
                // Extended spreader lip
                translate([TRANSITION_LENGTH, 0, 0]) {
                    // Upper lip
                    cube([20, SPREAD_WIDTH, WALL], center=true);
                    // Lower lip (angled down)
                    translate([20, 0, -GAP/2 - WALL/2]) {
                        rotate([-LIP_ANGLE, 0, 0]) {
                            cube([15, SPREAD_WIDTH, WALL], center=true);
                        }
                    }
                }
            }
        }
        
        // Hollow interior
        // Inlet tube hollow
        translate([-SPREAD_WIDTH/2, 0, 0]) {
            rotate([0, 90, 0]) {
                cylinder(h=COUPLING_DEPTH + 1, r=INNER_R);
            }
        }
        
        // Transition interior
        translate([-SPREAD_WIDTH/2, 0, COUPLING_DEPTH]) {
            hull() {
                translate([0, 0, 0]) {
                    rotate([0, 90, 0]) {
                        cylinder(h=1, r=INNER_R);
                    }
                }
                translate([TRANSITION_LENGTH, 0, 0]) {
                    translate([0, 0, -GAP/2]) {
                        cube([1, SPREAD_WIDTH - WALL*2, GAP], center=true);
                    }
                }
            }
            
            // Slot opening
            translate([TRANSITION_LENGTH, 0, 0]) {
                translate([-5, 0, -GAP/2]) {
                    cube([30, SPREAD_WIDTH - WALL*2, GAP], center=true);
                }
            }
        }
        
        // V-notches on the lip
        for (x = [-SPREAD_WIDTH/2 + NOTCH_SPACING: NOTCH_SPACING: SPREAD_WIDTH/2 - NOTCH_SPACING]) {
            translate([-SPREAD_WIDTH/2 + COUPLING_DEPTH + TRANSITION_LENGTH + 25, x, -GAP/2 - WALL - 1]) {
                rotate([90, 0, 0]) {
                    cylinder(h=WALL*3, r1=0, r2=NOTCH_DEPTH, $fn=3);
                }
            }
        }
    }
}

// Flange for bolting to venturi
module flange() {
    translate([-SPREAD_WIDTH/2, 0, 0]) {
        rotate([0, 90, 0]) {
            difference() {
                cylinder(h=5, r=OUTER_R + 10);
                cylinder(h=6, r=OUTER_R);
                // Bolt holes — 4× M6 on 130mm circle
                for (a = [0:90:270]) {
                    rotate([0, 0, a]) {
                        translate([0, 90, -1]) {
                            cylinder(h=7, r=3.5);
                        }
                    }
                }
            }
        }
    }
}

// Assemble
spreader();
// Optional flange if bolting instead of gluing
// translate([0, 0, -5]) flange();
