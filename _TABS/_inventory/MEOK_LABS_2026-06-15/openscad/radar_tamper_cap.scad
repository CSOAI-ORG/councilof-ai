// TAMPER-EVIDENT TPU SCREW CAPS
// Print: TPU 95A 0.20mm (flex, slightly malleable to show tampering)
// 4 caps per radar unit × 5 units = 20 caps total
// Print time: ~15 sec per cap in TPU
//
// Each cap clicks onto an M3 screw. Tampering = visible deformation.

/* [Cap Geometry] */
CAP_DIA = 8;            // mm outer diameter
CAP_HEIGHT = 4;         // mm height
SOCKET_DIA = 4;         // mm hex socket inside (snap-fit on M3)
DOME_HEIGHT = 1.5;      // mm top dome

$fn = 32;

module tamper_cap() {
    difference() {
        union() {
            // Cylindrical body
            cylinder(h=CAP_HEIGHT, d=CAP_DIA);
            // Top dome
            translate([0, 0, CAP_HEIGHT])
                sphere(d=CAP_DIA);
            // Tab (anti-rotation feature)
            translate([CAP_DIA/2, -1, CAP_HEIGHT/2])
                cube([2, 2, 1.5]);
        }
        // Snap-fit socket
        translate([0, 0, CAP_HEIGHT - 3])
            cylinder(h=3.5, d=SOCKET_DIA);
        // Snap-fit slit for easier fitting
        translate([CAP_DIA/2 - 0.5, -1, CAP_HEIGHT - 3])
            cube([1, 2, 3.5]);
    }
}

tamper_cap();