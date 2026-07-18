// RADAR ENCLOSURE v1 — OpenRadar + RD-03D + ESP32-S3
// Print: PA12-CF 0.16mm (top + bottom)
// Secures: RD-03D + ESP32-S3 + LD2450 (dual radar option)
// Security: tamper-evident screw caps in TPU
//
// Single piece. Fits Qidi Max4 (392x410mm) easily.

/* [Enclosure Dimensions] */
ENCL_W = 70;          // mm width
ENCL_L = 90;          // mm length
ENCL_H = 35;          // mm height
WALL = 3;             // mm wall thickness
LID_THICK = 2.5;      // mm top lid

/* [PCB Mounts] */
PCB_STANDOFF_DIA = 4; // M3 standoff hole
PCB_RAIL_OFFSET = 5; // from edge

/* [Sensor Apertures] */
RD03D_HOLE = 12;      // front face — 12mm for RD-03D sensor
LD2450_HOLE = 8;      // side face — 8mm for LD2450
CABLE_HOLE = 8;       // USB-C bottom cable pass-through

$fn = 64;

module rounded_box(w, l, h, r) {
    hull() {
        for (x = [-r, w-r], y = [-r, l-r], z = [-r, h-r])
            translate([x, y, z]) cube([r*2, r*2, 0.01]);
    }
    cube([w, l, h]);
}

module enclosure_bottom() {
    difference() {
        // Main body with rounded edges
        union() {
            rounded_box(ENCL_W, ENCL_L, ENCL_H, 3);
        }
        // Hollow interior (offset by WALL)
        translate([WALL, WALL, WALL])
            rounded_box(ENCL_W - 2*WALL, ENCL_L - 2*WALL, ENCL_H - WALL, 2);
    }
    
    // PCB mounting standoffs (4 corners of PCB)
    translate([PCB_RAIL_OFFSET, PCB_RAIL_OFFSET, -1])
        cylinder(h=10, d=PCB_STANDOFF_DIA);
    translate([ENCL_W - PCB_RAIL_OFFSET, PCB_RAIL_OFFSET, -1])
        cylinder(h=10, d=PCB_STANDOFF_DIA);
    translate([PCB_RAIL_OFFSET, ENCL_L - PCB_RAIL_OFFSET, -1])
        cylinder(h=10, d=PCB_STANDOFF_DIA);
    translate([ENCL_W - PCB_RAIL_OFFSET, ENCL_L - PCB_RAIL_OFFSET, -1])
        cylinder(h=10, d=PCB_STANDOFF_DIA);
    
    // Sensor apertures
    // RD-03D front face (center top)
    translate([ENCL_W/2, ENCL_H/2, -1])
        cylinder(h=15, d=RD03D_HOLE, $fn=32);
    // LD2450 side face (right)
    translate([ENCL_W, ENCL_L/2, ENCL_H/2])
        rotate([0, 90, 0])
        cylinder(h=15, d=LD2450_HOLE, $fn=32);
    // USB-C bottom cable
    translate([ENCL_W/2, ENCL_L - 10, -1])
        rounded_box(20, 12, 8, 2);
}

module enclosure_top_lid() {
    difference() {
        // Lid with rounded edges
        union() {
            rounded_box(ENCL_W, ENCL_L, LID_THICK, 3);
            // Vent slots
            translate([ENCL_W/2 - 10, 5, LID_THICK])
                rounded_box(20, 1.5, 0.5, 0.5);
            translate([ENCL_W/2 - 10, ENCL_L - 7, LID_THICK])
                rounded_box(20, 1.5, 0.5, 0.5);
        }
        // Mount holes
        translate([PCB_RAIL_OFFSET, PCB_RAIL_OFFSET, -1])
            cylinder(h=LID_THICK+2, d=PCB_STANDOFF_DIA);
        translate([ENCL_W - PCB_RAIL_OFFSET, PCB_RAIL_OFFSET, -1])
            cylinder(h=LID_THICK+2, d=PCB_STANDOFF_DIA);
        translate([PCB_RAIL_OFFSET, ENCL_L - PCB_RAIL_OFFSET, -1])
            cylinder(h=LID_THICK+2, d=PCB_STANDOFF_DIA);
        translate([ENCL_W - PCB_RAIL_OFFSET, ENCL_L - PCB_RAIL_OFFSET, -1])
            cylinder(h=LID_THICK+2, d=PCB_STANDOFF_DIA);
        // CSOAI stamp recess
        translate([ENCL_W/2, ENCL_L - 8, LID_THICK])
        rotate([0, 0, 0])
        linear_extrude(height=0.1)
        text("CSOAI DEFONEOS", size=3, halign="center", valign="center", $fn=12);
    }
}

// Render both
union() {
    enclosure_bottom();
    translate([ENCL_W + 10, 0, 0])
        enclosure_top_lid();
}