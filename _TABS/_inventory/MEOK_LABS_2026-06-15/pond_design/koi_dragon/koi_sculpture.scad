// KOI SCULPTURE — parametric, clips onto waterfall block
// Koi swimming UP the waterfall — represents the journey to dragonhood
// Prints flat on its side, 0.1mm layer for detail
// Clips onto the waterfall block's front face via dovetail

// Material: Yellow (your cheap yellow filament = golden koi)
// Then use the white for highlights, black for eyes

/* [Koi Size] */
KOI_LENGTH = 250;       // mm — total length (fits 370mm block width)
KOI_HEIGHT = 80;        // mm — body height
BODY_WIDTH = 25;        // mm — body thickness

/* [Detail] */
$fn = 32;

// Koi body — elliptical cross-section, tapering at tail
module koi_body() {
    rotate([0, 0, 90]) {  // swims upward
        // Main body — uses hull of spheres for organic shape
        hull() {
            // Head (round)
            translate([KOI_LENGTH * 0.2, 0, 0]) {
                scale([1.2, 0.8, 0.6]) {
                    sphere(r=KOI_HEIGHT/2);
                }
            }
            // Middle (thickest)
            translate([KOI_LENGTH * 0.45, 0, 0]) {
                scale([1, 1, 0.7]) {
                    sphere(r=KOI_HEIGHT/2.2);
                }
            }
            // Tail base
            translate([KOI_LENGTH * 0.7, 0, 0]) {
                scale([0.7, 0.6, 0.4]) {
                    sphere(r=KOI_HEIGHT/2.5);
                }
            }
            // Tail tip (narrow)
            translate([KOI_LENGTH * 0.9, 0, 0]) {
                scale([0.3, 0.2, 0.1]) {
                    sphere(r=KOI_HEIGHT/2);
                }
            }
        }
    }
}

// Tail fin — sweeping, flowing
module tail_fin() {
    rotate([0, 0, 90]) {
        translate([KOI_LENGTH * 0.85, 0, 0]) {
            hull() {
                // Base at tail
                translate([0, 0, 0]) {
                    sphere(r=3);
                }
                // Flowing tips
                translate([-20, KOI_HEIGHT/2.5, 0]) {
                    sphere(r=1.5);
                }
                translate([-20, -KOI_HEIGHT/2.5, 0]) {
                    sphere(r=1.5);
                }
                translate([-10, KOI_HEIGHT/3, KOI_HEIGHT/4]) {
                    sphere(r=1.5);
                }
                translate([-10, -KOI_HEIGHT/3, -KOI_HEIGHT/4]) {
                    sphere(r=1.5);
                }
            }
        }
    }
}

// Dorsal fin
module dorsal_fin() {
    rotate([0, 0, 90]) {
        translate([KOI_LENGTH * 0.35, 0, 0]) {
            hull() {
                translate([0, 0, 0]) {
                    sphere(r=2);
                }
                translate([KOI_LENGTH * 0.2, 0, KOI_HEIGHT/3]) {
                    sphere(r=1.5);
                }
                translate([-KOI_LENGTH * 0.1, 0, KOI_HEIGHT/2.5]) {
                    sphere(r=1.5);
                }
            }
        }
    }
}

// Pectoral fins — pushing against the waterfall
module pectoral_fin(side) {
    rotate([0, 0, 90]) {
        translate([KOI_LENGTH * 0.35, side * KOI_HEIGHT/3, 0]) {
            hull() {
                translate([0, 0, 0]) {
                    sphere(r=2.5);
                }
                // Fin extends outward and back — looks like swimming up
                translate([KOI_LENGTH * 0.1, side * KOI_HEIGHT/2, KOI_HEIGHT/6]) {
                    sphere(r=1.5);
                }
                translate([-KOI_LENGTH * 0.05, side * KOI_HEIGHT/1.8, KOI_HEIGHT/8]) {
                    sphere(r=1.5);
                }
            }
        }
    }
}

// Eyes
module eye() {
    rotate([0, 0, 90]) {
        translate([KOI_LENGTH * 0.15, KOI_HEIGHT/5, KOI_HEIGHT/6]) {
            sphere(r=3);
        }
    }
}

// Barbels (whiskers) — koi have them
module barbel() {
    rotate([0, 0, 90]) {
        translate([KOI_LENGTH * 0.05, KOI_HEIGHT/4, 0]) {
            rotate([0, 0, -30]) {
                hull() {
                    sphere(r=1.5);
                    translate([0, 0, -KOI_LENGTH * 0.08]) {
                        sphere(r=0.8);
                    }
                }
            }
        }
    }
}

// Mount — dovetail that clips onto the waterfall block
module mount_dovetail() {
    translate([0, 0, -BODY_WIDTH/2]) {
        linear_extrude(height=10) {
            polygon(points=[
                [KOI_LENGTH * 0.25, -5],
                [KOI_LENGTH * 0.25, 5],
                [KOI_LENGTH * 0.3, 8],
                [KOI_LENGTH * 0.7, 8],
                [KOI_LENGTH * 0.75, 5],
                [KOI_LENGTH * 0.75, -5],
                [KOI_LENGTH * 0.7, -8],
                [KOI_LENGTH * 0.3, -8],
            ]);
        }
    }
}

// Assemble
union() {
    koi_body();
    tail_fin();
    dorsal_fin();
    pectoral_fin(1);
    pectoral_fin(-1);
    eye();
    translate([0, 0, 1]) barbel();
    translate([0, 0, -1]) barbel();
    mount_dovetail();
}

echo(str("Koi length: ", KOI_LENGTH, "mm"));
echo(str("Fits block: ", KOI_LENGTH < 370, " — YES"));
