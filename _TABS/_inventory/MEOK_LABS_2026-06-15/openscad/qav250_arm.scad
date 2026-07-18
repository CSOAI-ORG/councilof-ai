// QAV-250 Arm — single arm, 2207 motor, 5" prop clearance
// Print: PA6-CF 0.16mm (highest strength, resists prop impacts)
// 4 arms needed for each drone (×3 drones = 12 arms total)
// Print time: ~30 min per arm in PA6-CF

/* [Arm Geometry] */
ARM_LEN = 95;             // mm total length
ARM_WIDTH_BASE = 30;      // mm wide at frame
ARM_WIDTH_TIP = 18;       // mm wide at motor mount
ARM_THICK_BASE = 5;       // mm thicker at the base
ARM_THICK_TIP = 4;        // mm at the tip
ARM_VERTICAL_THICK = 4;
ARM_MOTOR_HOLE_DIA = 16;  // mm center motor mount
ARM_MOTOR_HOLE_SPACING = 19; // mm between motor screws
ARM_HOLE_DIA = 3;         // mm M3 mounting

$fn = 64;

// Single arm drawn flat as a tapered plate
module arm_flat() {
    hull() {
        cube([ARM_LEN, ARM_WIDTH_BASE, ARM_THICK_BASE]);
        translate([ARM_LEN, 0, 0]) 
            cube([1, ARM_WIDTH_TIP, ARM_THICK_TIP]); // placeholder for taper
    }
}

// Better: defined geometry with proper taper
module arm_proper() {
    linear_extrude(height=ARM_VERTICAL_THICK) {
        polygon(points=[
            [0, 0],
            [ARM_LEN, 0],
            [ARM_LEN + ARM_WIDTH_TIP - ARM_WIDTH_BASE, ARM_WIDTH_BASE],
            [0, ARM_WIDTH_BASE],
        ]);
    }
}

difference() {
    arm_proper();
    
    // Motor mount holes
    translate([ARM_LEN + ARM_WIDTH_TIP/2 - ARM_WIDTH_BASE, ARM_WIDTH_BASE/2, -1])
        cylinder(h=ARM_VERTICAL_THICK+2, d=ARM_MOTOR_HOLE_DIA);
    
    // 4× M3 motor mount screws around center
    for (dx = [-1, 1], dy = [-1, 1]) {
        translate([
            ARM_LEN + ARM_WIDTH_TIP/2 - ARM_WIDTH_BASE + dx * ARM_MOTOR_HOLE_SPACING/2,
            ARM_WIDTH_BASE/2 + dy * ARM_MOTOR_HOLE_SPACING/2,
            -1
        ])
            cylinder(h=ARM_VERTICAL_THICK+2, d=ARM_HOLE_DIA);
    }
    
    // Mount hole on the frame end
    translate([8, ARM_WIDTH_BASE/2, -1])
        cylinder(h=ARM_VERTICAL_THICK+2, d=ARM_HOLE_DIA);
}