// RADAR MOUNT BRACKET — wall/pole attachment
// Print: PA6-CF 0.16mm (highest structural strength, weather)
// Mounts the radar enclosure to a pole, wall, or fence
// 5 brackets for 5 radars
//
// Print: PA6-CF, ~30min per bracket

/* [Bracket Dimensions] */
BRACKET_W = 90;        // mm horizontal span
BRACKET_H = 100;       // mm vertical
BRACKET_THICK = 4;     // mm base thickness
POLE_DIA = 30;          // mm pole diameter (curved back)
WALL_HOLE_DIA = 6;      // mm M5 wall anchor hole

$fn = 48;

// The pole-clamp half (curved back)
module pole_clamp_half() {
    difference() {
        translate([0, 0, 0])
            cube([BRACKET_W/2, BRACKET_H, BRACKET_THICK]);
        translate([BRACKET_W/2, BRACKET_H/2, BRACKET_THICK/2])
            rotate([0, 0, 0])
            rotate([90, 0, 0])
            cylinder(h=BRACKET_H+1, d=POLE_DIA, $fn=64);
    }
}

difference() {
    union() {
        // Pole clamp
        pole_clamp_half();
        // Mount plate (extends to side with M5 holes)
        translate([BRACKET_W*0.7, BRACKET_H*0.3, 0])
            cube([BRACKET_W*0.6, BRACKET_H*0.4, BRACKET_THICK]);
    }
    // 4× M5 wall mount holes
    translate([BRACKET_W*0.9, BRACKET_H*0.4, -1])
        cylinder(h=BRACKET_THICK+2, d=WALL_HOLE_DIA);
    translate([BRACKET_W*0.9, BRACKET_H*0.6, -1])
        cylinder(h=BRACKET_THICK+2, d=WALL_HOLE_DIA);
    translate([BRACKET_W*1.1, BRACKET_H*0.4, -1])
        cylinder(h=BRACKET_THICK+2, d=WALL_HOLE_DIA);
    translate([BRACKET_W*1.1, BRACKET_H*0.6, -1])
        cylinder(h=BRACKET_THICK+2, d=WALL_HOLE_DIA);
    // Mount hole for the enclosure (M3 bolt to attach bottom)
    translate([25, BRACKET_H*0.7, -1])
        cylinder(h=BRACKET_THICK+2, d=4);
}