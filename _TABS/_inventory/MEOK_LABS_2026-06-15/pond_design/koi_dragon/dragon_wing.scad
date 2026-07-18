// DRAGON WING — single piece, 370mm span, parametric
// Prints flat on the bed, slots into dragon head wing mount
// Bat-wing design: membrane between structural fingers

// Material: PA12-CF black (for the frame) or translucent PETG (backlit effect)

/* [Wing Dimensions] */
SPAN = 370;             // mm — total span from shoulder to tip
CHORD = 150;            // mm — wing depth (shoulder to trailing edge)
FINGER_COUNT = 5;       // number of structural fingers
MEMBRANE_THICK = 1.5;   // mm — thin for translucency
FRAME_THICK = 4;        // mm — structural frame

$fn = 24;

// Wing frame — fingers radiating from shoulder
module wing_frame() {
    // Shoulder joint — mounts to dragon head
    translate([0, 0, 0]) {
        cylinder(h=FRAME_THICK, r=15);
    }
    
    // Main leading edge spar
    translate([0, 0, 0]) {
        rotate([0, 0, -45]) {
            hull() {
                cylinder(h=FRAME_THICK, r=12);
                translate([SPAN * 0.8, 0, 0]) {
                    cylinder(h=FRAME_THICK, r=4);
                }
            }
        }
    }
    
    // Fingers — radiating structure
    for (i = [0: FINGER_COUNT - 1]) {
        angle = -70 + i * 15;  // fan out
        translate([0, 0, 0]) {
            rotate([0, 0, angle]) {
                hull() {
                    cylinder(h=FRAME_THICK, r=8);
                    length = CHORD * (0.5 + i * 0.12);
                    translate([0, length, 0]) {
                        cylinder(h=FRAME_THICK, r=2);
                    }
                }
            }
        }
    }
}

// Membrane — thin web between fingers
module membrane() {
    linear_extrude(height=MEMBRANE_THICK) {
        // Approximate shape using a polygon between finger tips
        polygon(points=[
            [0, 0],  // shoulder
            // Along leading edge
            [SPAN * 0.3, -20],
            [SPAN * 0.5, -30],
            [SPAN * 0.7, -25],
            [SPAN * 0.85, -10],
            // Wing tip
            [SPAN * 0.9, 10],
            // Sweep back along trailing edge (finger tips)
            [SPAN * 0.75, CHORD * 0.3],
            [SPAN * 0.55, CHORD * 0.5],
            [SPAN * 0.35, CHORD * 0.55],
            [SPAN * 0.15, CHORD * 0.5],
            [0, CHORD * 0.35],
        ]);
    }
}

// Mount pin — slides into dragon head dovetail
module mount_pin() {
    translate([-15, 0, 0]) {
        cube([30, 12, FRAME_THICK + 5]);
    }
}

// Assembly
union() {
    wing_frame();
    membrane();
    mount_pin();
}

echo(str("Wing span: ", SPAN, "mm — fits bed: ", SPAN < 392));
echo(str("Fingers: ", FINGER_COUNT));
