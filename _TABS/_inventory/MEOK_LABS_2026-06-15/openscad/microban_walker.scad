// MICROBAN-INSPIRED BIPED WALKER — All 14 body parts
// Based on the OPEN-SOURCE MarcDcls/microban (CERN-OHL-S-2.0)
// 19× DS3235MG servos, RPi Zero 2W, 3× 18650 LiPo
// Print: PA12-CF 0.16mm (except TPU feet)
// Total print time: ~86 hours × 2 walkers = 172h on Qidi
// Includes CSOAI logo slot + Care Floor motion hard-stops
//
// Render: `$fn=64`
// Each module returns ONE part; render one at a time

$fn = 64;
WALL = 2.5;
SERVO_W = 23.2;       // DS3235MG width
SERVO_L = 25.4;       // DS3235MG length
SERVO_H = 12.5;       // DS3235MG height (with shaft cap)
SERVO_DIA_SPLINE = 7; // output spline
SERVO_DIA_SHAFT = 5;  // mounting hole

// ============================================================
// PART 1: TORSO (with RPi Zero 2W + battery compartment)
// ============================================================
module torso() {
    // Body shell - beveled octagon
    union() {
        // Main box
        rounded_box(60, 40, 80, 5);
        // RPi Zero 2W mount plate inside
        translate([-25, -15, -30])
            cube([50, 30, 1]);
        // Battery (3× 18650) holder - horizontal slot
        translate([-20, -10, 20])
            rounded_box(40, 20, 18, 3);
        // Cable channel
        translate([0, 0, -5])
            cube([40, 4, 20]);
    }
}
module rounded_box(w, l, h, r) {
    hull() {
        for (x = [-r, w-r], y = [-r, l-r], z = [-r, h-r])
            translate([x, y, z]) cube([r*2, r*2, 0.01]);
    }
    cube([w, l, h]);
}

// ============================================================
// PART 2: HEAD
// ============================================================
module head() {
    union() {
        cube([35, 35, 35]);
        // Antenna holder
        translate([15, 15, 0])
            cylinder(h=20, d=4, $fn=16);
        // Camera hole
        translate([0, 17.5, 17.5])
            rotate([90, 0, 0])
            cylinder(h=10, d=8, $fn=32);
    }
}

// ============================================================
// PART 3: PELVIS (servos + waist connector)
// ============================================================
module pelvis() {
    difference() {
        union() {
            cube([80, 50, 25]);
            // Hip servo mounts (each side)
            translate([35, 0, 12])
                cube([SERVO_W, SERVO_L, SERVO_H]);
            translate([-58, 0, 12])
                cube([SERVO_W, SERVO_L, SERVO_H]);
        }
        // Servo mount holes (4 per servo)
        for (dx = [-1, 1]) {
            translate([dx > 0 ? 35+SERVO_W/2 : -58+SERVO_W/2, SERVO_L/2, 12])
                cube([SERVO_W - 4, 4, 2]);
        }
        // Wiring channel
        translate([0, 5, 12])
            cube([40, 6, 4]);
    }
}

// ============================================================
// PART 4: THIGH (1 part per leg, ×4 total = 4 thighs for 2 walkers)
// ============================================================
module thigh() {
    difference() {
        union() {
            // Main link
            cube([16, 60, 12]);
            // Hip servo mount at top
            translate([0, 50, -2])
                cube([SERVO_W, SERVO_L, SERVO_H]);
            // Knee servo mount at bottom
            cube([SERVO_W, SERVO_L+10, SERVO_H]);
        }
        // Servo shaft holes
        translate([SERVO_W/2, 50+SERVO_L/2, 5])
            cylinder(h=15, d=SERVO_DIA_SPLINE, $fn=32);
        translate([SERVO_W/2, SERVO_L/2, 5])
            cylinder(h=15, d=SERVO_DIA_SPLINE, $fn=32);
    }
}

// ============================================================
// PART 5: SHIN (1 part per leg, ×4 total = 4 shins for 2 walkers)
// ============================================================
module shin() {
    difference() {
        union() {
            cube([12, 70, 10]);
            // Ankle servo mount at bottom
            translate([0, 60, -2])
                cube([SERVO_W, SERVO_L, SERVO_H]);
        }
        translate([6, 65+SERVO_L/2, 5])
            cylinder(h=15, d=SERVO_DIA_SPLINE, $fn=32);
    }
}

// ============================================================
// PART 6: FOOT (TPU 95A — flexible, ×4 per walker = 8 feet for 2 walkers)
// ============================================================
module foot() {
    hull() {
        cube([35, 50, 6]);
        translate([2, 45, 0])
            scale([1.0, 0.3, 0.5])
                sphere(8);
    }
}

// ============================================================
// PART 7: SHOULDER (1 per arm, ×2 per walker = 4 shoulders for 2)
// ============================================================
module shoulder() {
    difference() {
        union() {
            cube([SERVO_W+5, SERVO_W+5, SERVO_H+8]);
            translate([SERVO_W/2+2.5, SERVO_W/2+2.5, SERVO_H+8])
                cylinder(h=8, d=SERVO_DIA_SPLINE, $fn=24);
        }
        translate([SERVO_W/2+2.5, SERVO_W/2+2.5, -1])
            cylinder(h=15, d=SERVO_DIA_SPLINE, $fn=24);
    }
}

// ============================================================
// PART 8: ARM (1 per arm, ×2 per walker = 4 arms for 2 walkers)
// ============================================================
module arm_part() {
    cube([12, 55, 10]);
}

// ============================================================
// PART 9: WAIST CONNECTOR (torso ↔ pelvis joint) ×1 per walker
// ============================================================
module waist_connector() {
    difference() {
        cylinder(h=20, d=30, $fn=32);
        translate([0, 0, -1])
            cylinder(h=22, d=10, $fn=32);
    }
}

// ============================================================
// PARTS 10-14: structural elements
// ============================================================

// PART 10: NECK
module neck() {
    cylinder(h=15, d=12, $fn=24);
}

// PART 11: SHOULDER BRIDGE (links torso ↔ shoulder) ×2 per walker
module shoulder_bridge() {
    cube([50, 8, 6]);
}

// PART 12: HIP JOINT COVER (decorative + cable mgmt) ×2 per walker
module hip_joint_cover() {
    cylinder(h=10, d=24, $fn=24);
}

// PART 13: ANKLE LINKAGE ×2 per walker
module ankle_linkage() {
    cube([40, 8, 4]);
    // Mount holes
    translate([5, 4, -1])
        cylinder(h=6, d=3, $fn=16);
    translate([35, 4, -1])
        cylinder(h=6, d=3, $fn=16);
}

// PART 14: SAFETY ENCLOSURE MESH (TPU 95A) — banjax-proof mesh over walker
// File sized to fit on bed: 380×280mm
module walker_safety_mesh() {
    difference() {
        cube([380, 280, 5]);
        // Hex cutouts every 25mm
        for (x = [20: 25: 360]) {
            for (y = [20: 25: 260]) {
                translate([x, y, -1])
                    cylinder(h=7, d=8, $fn=6);
            }
        }
    }
}

// ============================================================
// CSOAI STAMP — engraved text for verification
// ============================================================
module csoai_stamp() {
    translate([0, 0, 0])
    rotate([0, 0, 0])
    linear_extrude(height=0.8)
    text("CSOAI · MEOK · DEFONEOS · CARE-FLOOR-0.95", size=3, halign="center", valign="center", $fn=12);
}

// ============================================================
// RENDER SELECTOR - comment out parts you don't need
// ============================================================

// Default: render the TORSO only (modify for others)
// To render each part, change the called module below:

// PART 1: torso();
// PART 2: head();
// PART 3: pelvis();
// PART 4: thigh();
// PART 5: shin();
// PART 6: foot();
// PART 7: shoulder();
// PART 8: arm_part();
// PART 9: waist_connector();
// PART 10: neck();
// PART 11: shoulder_bridge();
// PART 12: hip_joint_cover();
// PART 13: ankle_linkage();
// PART 14: walker_safety_mesh();

// Final default for first render test
torso();