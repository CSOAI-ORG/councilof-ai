// FIRE MANIFOLD — interchangeable screw-in mist nozzle for dragon mouth
// Flame-pattern hole arrangement: outer ring = 1mm mist, inner = 2.5mm jet
// Screws into dragon head via 50mm thread
// Unscrew to swap between: FIRE, JET, MIST, or JET+MIST

// Prints flat on bed, 0.1mm layer height for clean 1mm holes
// Material: PA12-CF (structural, waterproof)

/* [Connector] */
THREAD_DIA = 50;        // mm — outer thread diameter for dragon mouth
THREAD_PITCH = 3;       // mm — coarse thread for easy swapping
THREAD_HEIGHT = 15;     // mm — how deep the thread section is

/* [Nozzle Pattern] */
NOZZLE_TYPE = "fire";   // "fire" | "jet" | "mist" | "combo"
// Fire pattern: outer ring of 1mm holes, inner ring of 2.5mm
// Jet: single 5mm hole in centre
// Mist: 50× 0.5mm holes
// Combo: all of the above (epic)

WALL = 2.5;             // mm
$fn = 48;

// Outer ring — the "flame" visual (many small holes)
OUTER_RING_R = 20;      // mm — radius of outer ring
OUTER_HOLES = 60;       // count — flame tips
OUTER_HOLE_DIA = 1;     // mm — small = mist

// Inner ring — the power (main water jets)
INNER_RING_R = 10;      // mm — radius of inner ring
INNER_HOLES = 8;        // count
INNER_HOLE_DIA = 2.5;   // mm — larger = arc distance

// Centre — the core jet
CENTER_HOLE_DIA = 3;    // mm — main water column

// Face plate
module face_plate() {
    cylinder(h=4, r=THREAD_DIA/2 + WALL);
}

// Threaded base — screws into dragon mouth
module threaded_base() {
    rotate([0, 0, 0]) {
        difference() {
            cylinder(h=THREAD_HEIGHT, r=THREAD_DIA/2 + WALL);
            translate([0, 0, -1]) {
                cylinder(h=THREAD_HEIGHT + 2, r=THREAD_DIA/2 - 0.5);
            }
        }
    }
    // The thread (simplified as ridges — functional enough for PLA/PETG)
    for (z = [0: THREAD_PITCH: THREAD_HEIGHT]) {
        translate([0, 0, z]) {
            rotate_extrude() {
                translate([THREAD_DIA/2 - 0.5, 0, 0]) {
                    circle(r=1.2);
                }
            }
        }
    }
}

// Hollow interior — water chamber that distributes to all holes
module water_chamber() {
    // Chamber inside the face plate
    translate([0, 0, -3]) {
        cylinder(h=6, r=OUTER_RING_R + 3);
    }
}

// The hole patterns
module fire_pattern() {
    // Outer ring — 60 × 1mm holes (the "flame" visual)
    for (i = [0: OUTER_HOLES - 1]) {
        angle = i * 360 / OUTER_HOLES;
        // Add slight variation to hole position for organic flame look
        r_var = OUTER_RING_R + sin(i * 47) * 2;
        translate([r_var * cos(angle), r_var * sin(angle), -1]) {
            cylinder(h=6, r=OUTER_HOLE_DIA/2);
        }
    }
    
    // Inner ring — 8 × 2.5mm holes (the power)
    for (i = [0: INNER_HOLES - 1]) {
        angle = i * 360 / INNER_HOLES + 15;
        translate([INNER_RING_R * cos(angle), INNER_RING_R * sin(angle), -1]) {
            cylinder(h=6, r=INNER_HOLE_DIA/2);
        }
    }
    
    // Centre — 3mm hole (the main arc)
    translate([0, 0, -1]) {
        cylinder(h=6, r=CENTER_HOLE_DIA/2);
    }
}

module jet_pattern() {
    // Single 5mm hole for maximum water arc
    translate([0, 0, -1]) {
        cylinder(h=6, r=5/2);
    }
}

module mist_pattern() {
    // 50 × 0.5mm holes for fine fog
    for (i = [0: 49]) {
        angle = i * 137.508;  // golden angle for even distribution
        r = 5 + (i % 15) * 1.2;
        translate([r * cos(angle), r * sin(angle), -1]) {
            cylinder(h=6, r=0.4);  // 0.8mm hole (printable at 0.1mm layers)
        }
    }
}

// Build
difference() {
    union() {
        face_plate();
        threaded_base();
    }
    water_chamber();
    
    // Add the hole pattern based on type
    if (NOZZLE_TYPE == "fire") {
        fire_pattern();
    } else if (NOZZLE_TYPE == "jet") {
        jet_pattern();
    } else if (NOZZLE_TYPE == "mist") {
        mist_pattern();
    } else {  // combo = all of them
        fire_pattern();
        // jet_pattern(); // (overlaps with fire's centre — pick one)
        mist_pattern();
    }
}

echo(str("Fire Manifold — ", NOZZLE_TYPE, " mode"));
echo(str("Outer ring: ", OUTER_HOLES, " × ", OUTER_HOLE_DIA, "mm holes"));
echo(str("Inner ring: ", INNER_HOLES, " × ", INNER_HOLE_DIA, "mm holes"));
echo(str("Centre jet: ", CENTER_HOLE_DIA, "mm"));
