// DRAGON HEAD — top of the waterfall wall, breathes mist/fire
// Water flows through the neck, exits through the interchangeable fire manifold
// Wings mount on the sides via dovetail slots
// Screw-in 50mm receptacle for the fire manifold at the mouth

// Print: PA12-CF, 0.12mm layer for detail, tree supports for jaw/underbelly
// Bed fit: 370mm max dimension

/* [Head Dimensions] */
HEAD_LENGTH = 300;      // mm — snout to back of head (fits 392mm bed)
HEAD_WIDTH = 200;       // mm — wide jaw for dramatic presence
HEAD_HEIGHT = 180;      // mm — tall crown/crest

/* [Mouth] */
MOUTH_OPEN = 40;        // mm — how wide the jaw is open
MANIFOLD_THREAD = 50;   // mm — screw thread for fire manifold

/* [Neck/Water Connection] */
NECK_DIA = 80;          // mm — water channel through neck
NECK_HEIGHT = 60;       // mm — how far down the neck extends

WALL = 4;
$fn = 48;

module dragon_head() {
    // Neck — connects to the top waterfall block
    // Contains the water channel that feeds the mouth
    translate([0, 0, -NECK_HEIGHT]) {
        difference() {
            cylinder(h=NECK_HEIGHT, r=NECK_DIA/2 + WALL);
            cylinder(h=NECK_HEIGHT + 1, r=NECK_DIA/2 - WALL);
        }
    }
    
    // Skull — main head body
    // Organic shape approximated with hull of spheres
    difference() {
        hull() {
            // Back of head
            translate([-HEAD_LENGTH * 0.2, 0, HEAD_HEIGHT * 0.5]) {
                scale([1, 1.2, 1]) {
                    sphere(r=HEAD_HEIGHT * 0.35);
                }
            }
            // Top of head / crown
            translate([-HEAD_LENGTH * 0.1, 0, HEAD_HEIGHT * 0.8]) {
                sphere(r=HEAD_HEIGHT * 0.3);
            }
            // Snout top
            translate([HEAD_LENGTH * 0.4, 0, HEAD_HEIGHT * 0.5]) {
                scale([1, 0.8, 0.6]) {
                    sphere(r=HEAD_HEIGHT * 0.2);
                }
            }
            // Upper jaw
            translate([HEAD_LENGTH * 0.5, 0, HEAD_HEIGHT * 0.3]) {
                scale([1, 0.6, 0.5]) {
                    sphere(r=HEAD_HEIGHT * 0.15);
                }
            }
            // Lower jaw (open, angled down)
            translate([HEAD_LENGTH * 0.4, 0, HEAD_HEIGHT * 0.1]) {
                scale([1, 0.5, 0.4]) {
                    sphere(r=HEAD_HEIGHT * 0.2);
                }
            }
        }
        
        // Hollow interior — water channel from neck to mouth
        // Path curves from neck up through the mouth
        // Water channel
        translate([-HEAD_LENGTH * 0.1, 0, HEAD_HEIGHT * 0.3]) {
            rotate([0, 30, 0]) {
                cylinder(h=HEAD_LENGTH, r=NECK_DIA/3);
            }
        }
        
        // Mouth cavity — space where the manifold screws in
        translate([HEAD_LENGTH * 0.35, 0, HEAD_HEIGHT * 0.25]) {
            rotate([0, -15, 0]) {
                cylinder(h=40, r=MANIFOLD_THREAD/2 + 2);
            }
        }
    }
    
    // Screw receptacle for fire manifold (at the mouth)
    translate([HEAD_LENGTH * 0.5, 0, HEAD_HEIGHT * 0.2]) {
        rotate([0, -15, 0]) {
            difference() {
                cylinder(h=25, r=MANIFOLD_THREAD/2 + WALL);
                translate([0, 0, -1]) {
                    cylinder(h=27, r=MANIFOLD_THREAD/2 - 1);
                }
            }
        }
    }
    
    // Horns/crest — two swept horns
    translate([-HEAD_LENGTH * 0.15, HEAD_WIDTH/4, HEAD_HEIGHT * 0.7]) {
        rotate([0, 0, 15]) {
            cylinder(h=40, r1=8, r2=2);
        }
    }
    translate([-HEAD_LENGTH * 0.15, -HEAD_WIDTH/4, HEAD_HEIGHT * 0.7]) {
        rotate([0, 0, -15]) {
            cylinder(h=40, r1=8, r2=2);
        }
    }
    
    // Eyes — prominent sockets
    translate([HEAD_LENGTH * 0.15, HEAD_WIDTH/3, HEAD_HEIGHT * 0.5]) {
        sphere(r=12);
        translate([0, 0, -5]) {
            sphere(r=7);  // eye socket inset
        }
    }
    translate([HEAD_LENGTH * 0.15, -HEAD_WIDTH/3, HEAD_HEIGHT * 0.5]) {
        sphere(r=12);
        translate([0, 0, -5]) {
            sphere(r=7);
        }
    }
    
    // Nostrils
    translate([HEAD_LENGTH * 0.45, HEAD_WIDTH/5, HEAD_HEIGHT * 0.55]) {
        sphere(r=4);
    }
    translate([HEAD_LENGTH * 0.45, -HEAD_WIDTH/5, HEAD_HEIGHT * 0.55]) {
        sphere(r=4);
    }
}

// Wing mount slots — dovetail on each side
module wing_mount(side) {
    translate([-HEAD_LENGTH * 0.1, side * (HEAD_WIDTH/2 - 20), HEAD_HEIGHT * 0.3]) {
        rotate([0, 0, side * 15]) {
            difference() {
                union() {
                    cube([40, 15, 60]);
                }
                // Dovetail slot
                translate([-1, -2, 10]) {
                    rotate([0, 0, 0]) {
                        cube([42, 4, 40]);
                    }
                }
            }
        }
    }
}

// Assemble
union() {
    dragon_head();
    wing_mount(1);
    wing_mount(-1);
}

echo(str("Dragon head size: ", HEAD_LENGTH, "×", HEAD_WIDTH, "×", HEAD_HEIGHT, "mm"));
echo(str("Mouth manifold thread: M", MANIFOLD_THREAD));
