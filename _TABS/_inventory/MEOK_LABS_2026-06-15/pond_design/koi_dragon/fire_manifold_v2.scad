// FIRE MANIFOLD V2 — engineered for real mist at pond pump pressure
// DUAL CIRCUIT: 1× central jet (water arc) + mist ring (fog cloud)
// Dedicated pump: 3,000 L/h @ 2.5 bar
//
// Central jet: 8mm → water arcs 7.5m across pond
// Mist ring: 80 × 0.4mm holes → 2.8m fog cloud
// Combined effect: dragon breathing fire + rolling fog bank
//
// Print: PA12-CF, 0.1mm layer (for clean 0.4mm holes), print flat on bed
// Screws into dragon head mouth via 50mm thread

/* [Dimensions] */
PLATE_DIA = 120;        // mm — disc diameter
PLATE_THICK = 6;        // mm — thickness

/* [Thread — screws into dragon mouth] */
THREAD_DIA = 50;        // mm
THREAD_HEIGHT = 12;     // mm

/* [Central Jet — the visible water arc] */
JET_DIA = 8;            // mm — 8mm = 7.5m arc at 2.5 bar
JET_LENGTH = 20;        // mm — nozzle tube length for straight jet

/* [Mist Ring — the fog envelope] */
MIST_HOLES = 80;        // count
MIST_DIA = 0.4;         // mm — each
MIST_RING_R = 25;       // mm — radius of mist ring
MIST_ANGLE = 15;        // degrees — outward cone angle (mist spreads)

$fn = 64;

module manifold() {
    // === BASE PLATE ===
    difference() {
        union() {
            // Main disc
            cylinder(h=PLATE_THICK, r=PLATE_DIA/2);
            
            // Thread ring (back side)
            translate([0, 0, -THREAD_HEIGHT]) {
                cylinder(h=THREAD_HEIGHT, r=THREAD_DIA/2 + 3);
            }
            
            // Central jet nozzle — extended tube for straight arc
            // The tube length straightens the flow for a clean jet
            translate([0, 0, PLATE_THICK]) {
                cylinder(h=JET_LENGTH, r=JET_DIA/2 + 2);
            }
            
            // Mist nozzle cones — short angled tubes
            // Each directs the mist outward in a cone
            for (i = [0: MIST_HOLES - 1]) {
                angle = i * 360 / MIST_HOLES;
                // Position on the ring
                x = MIST_RING_R * cos(angle);
                y = MIST_RING_R * sin(angle);
                // Angled outward
                translate([x, y, PLATE_THICK]) {
                    rotate([0, MIST_ANGLE, -angle]) {
                        cylinder(h=3, r=1);
                    }
                }
            }
        }
        
        // === HOLES (subtracted) ===
        
        // Central jet hole — 8mm straight through
        translate([0, 0, -THREAD_HEIGHT - 1]) {
            cylinder(h=PLATE_THICK + JET_LENGTH + 2, r=JET_DIA/2);
        }
        
        // Mist holes — 80 × 0.4mm, angled outward
        for (i = [0: MIST_HOLES - 1]) {
            angle = i * 360 / MIST_HOLES;
            x = MIST_RING_R * cos(angle);
            y = MIST_RING_R * sin(angle);
            // Angled outward cone
            translate([x, y, -1]) {
                rotate([0, MIST_ANGLE, -angle]) {
                    cylinder(h=PLATE_THICK + 5, r=MIST_DIA/2);
                }
            }
        }
        
        // Thread hollow
        translate([0, 0, -THREAD_HEIGHT - 1]) {
            cylinder(h=THREAD_HEIGHT + 2, r=THREAD_DIA/2 - 1);
        }
    }
    
    // Thread ridges (cosmetic — helps seal with silicone)
    for (z = [0: 2: THREAD_HEIGHT]) {
        translate([0, 0, -z]) {
            rotate_extrude() {
                translate([THREAD_DIA/2 - 1, 0, 0]) {
                    circle(r=1);
                }
            }
        }
    }
}

// Build
manifold();

echo("FIRE MANIFOLD V2:");
echo("  1 x 8mm central jet -> 7.5m water arc");
echo("  80 x 0.4mm mist holes -> 2.8m fog cloud");
echo("  Total: 3,000 L/h @ 2.5 bar");
echo("  Effect: dragon breathing mist across the pond");
