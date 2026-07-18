// QAV-250 Frame — base plate
// Print: PA12-CF 0.16mm
// Specs: 250mm frame size, FPV racing, fits F722 FC + 4× 2207 motors
// 4 points listed for arm mounts, FC stack holes, VTX mount
//
// Single piece, fits Qidi Max4 bed (392x410mm)
//
// Print: PA12-CF 0.16mm, ~90min

/* [Frame Size] */
FRAME_SIZE = 250;       // mm, FPV standard
FRAME_PLATE_X = 135;    // mm width across the plate
FRAME_PLATE_Y = 110;    // mm depth
PLATE_THICK = 3;        // mm

/* [Motor Mount Holes] */
ARM_WIDTH = 12;         // mm, 5" prop arm thickness
ARM_LEN_FORWARD = 65;   // mm forward of center
ARM_LEN_REAR = 65;      // mm rear of center
ARM_HOLE_DIA = 16;      // mm (2207 motor mount M3)
ARM_HOLE_SPACING = 19;  // mm (2207 mount)

/* [FC Stack] */
FC_HOLE_DIA = 3;        // M3
FC_HOLE_SPACING = 30;   // mm standard 30x30 stack

/* [Camera Hole] */
CAM_HOLE = 14;          // mm FPV cam

WALL = 4;               // mm of solid material
$fn = 48;

module frame_plate() {
    union() {
        // Main body
        cube([FRAME_PLATE_X, FRAME_PLATE_Y, PLATE_THICK]);
        
        // Cut motor mount holes (front-left, front-right, rear-left, rear-right)
        translate([ARM_LEN_FORWARD, ARM_LEN_FORWARD, -1]) 
            cylinder(h=PLATE_THICK+2, d=ARM_HOLE_DIA);
        translate([-ARM_LEN_FORWARD, ARM_LEN_FORWARD, -1]) 
            cylinder(h=PLATE_THICK+2, d=ARM_HOLE_DIA);
        translate([ARM_LEN_FORWARD, -ARM_LEN_FORWARD, -1]) 
            cylinder(h=PLATE_THICK+2, d=ARM_HOLE_DIA);
        translate([-ARM_LEN_FORWARD, -ARM_LEN_FORWARD, -1]) 
            cylinder(h=PLATE_THICK+2, d=ARM_HOLE_DIA);
        
        // FC stack holes (30x30 grid pattern)
        translate([-15, -15, -1]) cylinder(h=PLATE_THICK+2, d=FC_HOLE_DIA);
        translate([15, -15, -1]) cylinder(h=PLATE_THICK+2, d=FC_HOLE_DIA);
        translate([-15, 15, -1]) cylinder(h=PLATE_THICK+2, d=FC_HOLE_DIA);
        translate([15, 15, -1]) cylinder(h=PLATE_THICK+2, d=FC_HOLE_DIA);
        
        // Camera hole at front
        translate([50, 0, -1]) cylinder(h=PLATE_THICK+2, d=CAM_HOLE);
    }
}

difference() {
    frame_plate();
    // Slot for FC stack with 30x30 cutout
    translate([0, 0, -0.1]) cube([34, 34, PLATE_THICK + 1]);
}