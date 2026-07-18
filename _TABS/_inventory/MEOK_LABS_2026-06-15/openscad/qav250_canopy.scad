// QAV-250 Canopy — protects FC + VTX + RX
// Print: PETG 0.20mm (UV-stable, low cost)
// 4 canopies needed for 3 drones
// Print time: ~15 min per canopy in PETG

/* [Canopy Geometry] */
CANOPY_W = 80;          // mm width
CANOPY_L = 80;          // mm length
CANOPY_H = 25;          // mm height
WALL = 2.5;             // mm wall thickness

$fn = 64;

module canopy_shell() {
    // Top dome (semicircular)
    difference() {
        // Bottom box
        cube([CANOPY_W, CANOPY_L, CANOPY_H]);
        // Hollow inside
        translate([WALL, WALL, WALL])
            cube([CANOPY_W - 2*WALL, CANOPY_L - 2*WALL, CANOPY_H]);
    }
    
    // Top semicircular dome (stretched)
    intersection() {
        translate([CANOPY_W/2, CANOPY_L/2, CANOPY_H])
            scale([CANOPY_W/2, CANOPY_L/2, CANOPY_H/2])
                sphere(r=1);
        translate([-CANOPY_W/2 - 10, -CANOPY_L/2 - 10, CANOPY_H - 10])
            cube([CANOPY_W + 20, CANOPY_L + 20, CANOPY_H + 10]);
    }
}

module canopy_with_mounts() {
    // 4× M3 mounting holes at corners
    difference() {
        canopy_shell();
        for (dx = [-1, 1], dy = [-1, 1]) {
            translate([
                CANOPY_W/2 + dx * (CANOPY_W/2 - 8),
                CANOPY_L/2 + dy * (CANOPY_L/2 - 8),
                -1
            ])
                cylinder(h=CANOPY_H + 2, d=3);
        }
    }
}

canopy_with_mounts();