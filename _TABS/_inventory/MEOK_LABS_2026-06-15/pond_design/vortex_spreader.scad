// VORTEX WATERFALL SPREADER — single piece, 340mm wide
// Re-designed to catch the spinning water from the vortex venturi
// The vortex makes the water sheet twist as it falls = light-catching waterfall
//
// Features:
// - 340mm wide (max single-piece on Qidi 350mm bed)
// - 6mm gap for visible water sheet
// - Angled lip (15° down) prevents wind blow-back
// - V-notches every 20mm break sheet into individual twisting streams
// - Flared side walls guide the spinning water into a smooth fan
//
// Print: PA12-CF, 0.2mm layer, flat on bed, NO supports needed

/* [Pipe Connection] */
INLET_DIA = 110;        // mm — matches vortex venturi outlet
COUPLING_DEPTH = 40;    // mm
WALL = 3.5;             // mm

/* [Spreader Geometry] */
SPREAD_WIDTH = 370;     // mm — max single-piece on 392mm X-axis (11mm margin each side)
GAP = 6;                // mm — slot opening (6mm = visible waterfall sheet + good aeration)
LIP_ANGLE = 15;         // degrees — downward angle for wind protection
TRANSITION_LENGTH = 80; // mm — round-inlet to rectangular-slot transition

/* [Vortex Enhancement] */
FLARE_ANGLE = 30;       // degrees — side walls flare outward to spread the spinning water
LIP_GLYPH_DEPTH = 4;    // mm — depth of V-notch glyphs on the lip

$fn = 48;

INNER_R = INLET_DIA / 2;
OUTER_R = INNER_R + WALL;

// Water entry tube + transition to wide slot
module spreader_body() {
    difference() {
        union() {
            // Inlet tube (connects to venturi outlet)
            translate([-SPREAD_WIDTH/2, 0, 0]) {
                rotate([0, 90, 0]) {
                    cylinder(h=COUPLING_DEPTH, r=OUTER_R);
                }
            }
            
            // Flared transition: round tube → wide rectangular slot
            translate([-SPREAD_WIDTH/2, 0, COUPLING_DEPTH]) {
                hull() {
                    // Inlet end (round)
                    translate([0, 0, 0]) {
                        rotate([0, 90, 0]) {
                            cylinder(h=1, r=OUTER_R);
                        }
                    }
                    // Outlet end (wide slot with flared sides)
                    translate([TRANSITION_LENGTH, 0, 0]) {
                        cube([1, SPREAD_WIDTH, GAP + WALL*2], center=true);
                    }
                }
                
                // Side wall flares — these guide the spinning water outward
                // Left flare
                translate([TRANSITION_LENGTH * 0.5, -SPREAD_WIDTH/2, 0]) {
                    rotate([0, 0, -FLARE_ANGLE]) {
                        cube([TRANSITION_LENGTH, WALL, GAP + WALL*2], center=true);
                    }
                }
                // Right flare
                translate([TRANSITION_LENGTH * 0.5, SPREAD_WIDTH/2, 0]) {
                    rotate([0, 0, FLARE_ANGLE]) {
                        cube([TRANSITION_LENGTH, WALL, GAP + WALL*2], center=true);
                    }
                }
                
                // Spreader lip (the business end)
                translate([TRANSITION_LENGTH, 0, 0]) {
                    // Upper lip
                    cube([20, SPREAD_WIDTH, WALL], center=true);
                    // Lower lip — angled down to prevent wind blow-back
                    translate([20, 0, -GAP/2 - WALL/2]) {
                        rotate([-LIP_ANGLE, 0, 0]) {
                            cube([15, SPREAD_WIDTH, WALL], center=true);
                        }
                    }
                }
            }
        }
        
        // Hollow interior — the water path
        translate([-SPREAD_WIDTH/2, 0, 0]) {
            rotate([0, 90, 0]) {
                cylinder(h=COUPLING_DEPTH + 1, r=INNER_R);
            }
        }
        
        // Transition to slot — hollow
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
        
        // V-notch glyphs — breaks the sheet into individual twisting streams
        // The spinning water + these notches = helical waterfall
        num_notches = floor(SPREAD_WIDTH / 20);
        notch_spacing = SPREAD_WIDTH / num_notches;
        for (i = [0:num_notches-1]) {
            x_pos = -SPREAD_WIDTH/2 + notch_spacing/2 + i * notch_spacing;
            translate([-SPREAD_WIDTH/2 + COUPLING_DEPTH + TRANSITION_LENGTH + 25, x_pos, -GAP/2 - WALL - 1]) {
                rotate([90, 0, 0]) {
                    cylinder(h=WALL*3, r1=0, r2=LIP_GLYPH_DEPTH, $fn=3);
                }
            }
        }
    }
}

// Flange for bolting/sealing to venturi outlet
module flange() {
    translate([-SPREAD_WIDTH/2, 0, 0]) {
        rotate([0, 90, 0]) {
            difference() {
                cylinder(h=6, r=OUTER_R + 12);
                cylinder(h=7, r=OUTER_R);
                // 4× bolt holes on 130mm circle
                for (a = [0:90:270]) {
                    rotate([0, 0, a]) {
                        translate([0, 0, -1]) {
                            cylinder(h=8, r=3.5);
                        }
                    }
                }
            }
        }
    }
}

// Build
spreader_body();
// Optional: uncomment for bolt-on version
// flange();

echo(str("Spreader: ", SPREAD_WIDTH, "mm wide × ", GAP, "mm gap — waterfall sheet"));
echo(str("Fits bed: ", SPREAD_WIDTH < 350, " (350mm bed limit)"));
