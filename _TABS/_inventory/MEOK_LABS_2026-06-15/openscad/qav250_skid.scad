// QAV-250 Landing Skid — simple TPU skid (flexible)
// Print: TPU 95A 0.20mm (flex, absorbs landings)
// 4 skids per drone, ×3 = 12 skids
// Print: ~25 min per pair in TPU

/* [Skid Geometry] */
SKID_LEN = 60;          // mm length
SKID_DIA = 12;          // mm diameter (rounded)
HOLE_DIA = 4;            // mm M3 mount hole

$fn = 32;

module landing_skid() {
    hull() {
        cylinder(h=SKID_DIA, d=SKID_DIA);
        translate([SKID_LEN, 0, 0])
            cylinder(h=SKID_DIA, d=SKID_DIA * 0.6);
    }
}

difference() {
    landing_skid();
    translate([0, 0, -1])
        cylinder(h=SKID_DIA+2, d=HOLE_DIA);
    translate([SKID_LEN * 0.7, 0, -1])
        cylinder(h=SKID_DIA+2, d=HOLE_DIA);
}