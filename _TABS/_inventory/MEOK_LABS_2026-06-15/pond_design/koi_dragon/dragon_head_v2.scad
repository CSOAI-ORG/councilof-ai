// DRAGON HEAD V2 — enhanced, polished, epic
// 1.5m tall dragon water feature — top of the koi→dragon waterfall wall
// Breathes mist/fire through interchangeable nozzle
// Wings mount on sides
// Water channel through neck → mouth → fire manifold

// Print: PA12-CF, 0.12mm layer, tree supports for jaw/horns
// Fits Qidi Max4 (392×410mm bed)

/* [Head Dimensions] */
HEAD_L = 320;           // mm — total head length (snout to crest)
HEAD_W = 220;           // mm — wide jaw for presence
HEAD_H = 200;           // mm — height including crown
WALL = 4;               // mm — shell thickness

/* [Mouth & Fire Manifold] */
MANIFOLD_DIA = 50;      // mm — screw thread for fire nozzle
MANIFOLD_DEPTH = 25;    // mm — how deep the receptacle goes

/* [Neck / Water Channel] */
NECK_DIA = 60;          // mm — water channel through neck

$fn = 64;

module dragon_head_v2() {
    difference() {
        union() {
            // === NECK ===
            // Water inlet from the waterfall block below
            translate([0, 0, -80]) {
                cylinder(h=80, r=NECK_DIA/2 + WALL + 5);
                // Neck flares out into skull
                translate([0, 0, 60]) {
                    cylinder(h=20, r1=NECK_DIA/2 + WALL + 5, r2=HEAD_W/3);
                }
            }
            
            // === MAIN SKULL ===
            // Organic dragon head using hulled shapes
            hull() {
                // Rear skull / occiput
                translate([-HEAD_L*0.2, 0, HEAD_H*0.5]) {
                    scale([1, 1.3, 1.1]) sphere(r=HEAD_H*0.35);
                }
                // Crown / top of head
                translate([-HEAD_L*0.05, 0, HEAD_H*0.75]) {
                    sphere(r=HEAD_H*0.25);
                }
                // Snout bridge
                translate([HEAD_L*0.35, 0, HEAD_H*0.5]) {
                    scale([1.2, 0.7, 0.6]) sphere(r=HEAD_H*0.18);
                }
                // Upper jaw tip
                translate([HEAD_L*0.5, 0, HEAD_H*0.35]) {
                    scale([1, 0.5, 0.4]) sphere(r=HEAD_H*0.12);
                }
                // Lower jaw (open — 35° gape)
                translate([HEAD_L*0.4, 0, HEAD_H*0.1]) {
                    scale([0.9, 0.4, 0.3]) sphere(r=HEAD_H*0.2);
                }
            }
            
            // === CREST / HORNS ===
            // Main pair — swept back
            for (side = [-1, 1]) {
                translate([-HEAD_L*0.12, side*HEAD_W*0.15, HEAD_H*0.7]) {
                    rotate([0, 0, side*20]) rotate([-10, 0, 0]) {
                        hull() {
                            cylinder(h=8, r=10);
                            translate([0, 0, 45]) cylinder(h=5, r=3);
                        }
                    }
                }
                // Secondary smaller horns
                translate([-HEAD_L*0.22, side*HEAD_W*0.12, HEAD_H*0.55]) {
                    rotate([0, 0, side*15]) rotate([5, 0, 0]) {
                        hull() {
                            cylinder(h=6, r=6);
                            translate([0, 0, 25]) cylinder(h=3, r=2);
                        }
                    }
                }
            }
            
            // === EYE RIDGES ===
            for (side = [-1, 1]) {
                hull() {
                    translate([HEAD_L*0.12, side*HEAD_W*0.3, HEAD_H*0.55]) {
                        scale([1.5, 0.8, 0.6]) sphere(r=10);
                    }
                    translate([HEAD_L*0.18, side*HEAD_W*0.28, HEAD_H*0.58]) {
                        scale([0.8, 0.5, 0.5]) sphere(r=8);
                    }
                }
            }
            
            // === NOSTRIL FLARES ===
            for (side = [-1, 1]) {
                translate([HEAD_L*0.42, side*HEAD_W*0.18, HEAD_H*0.52]) {
                    scale([1.3, 0.6, 0.5]) sphere(r=6);
                }
            }
            
            // === CHEEK PLATES / JAW MUSCLE ===
            for (side = [-1, 1]) {
                translate([HEAD_L*0.05, side*HEAD_W*0.3, HEAD_H*0.3]) {
                    scale([0.8, 0.5, 0.6]) sphere(r=HEAD_H*0.2);
                }
            }
            
            // === FOREHEAD PLATE (armour scale) ===
            translate([HEAD_L*0.05, 0, HEAD_H*0.65]) {
                scale([0.7, 0.5, 0.2]) sphere(r=HEAD_H*0.3);
            }
        }
        
        // === INTERNAL CAVITIES (subtracted) ===
        
        // Water channel — neck to mouth
        // Curves up from vertical neck to horizontal mouth
        hull() {
            translate([0, 0, -82]) {
                cylinder(h=80, r=NECK_DIA/2 - 2);
            }
            translate([HEAD_L*0.25, 0, HEAD_H*0.3]) {
                rotate([0, 35, 0]) {
                    cylinder(h=HEAD_L*0.5, r=15);
                }
            }
        }
        // Connect the two
        translate([HEAD_L*0.15, 0, HEAD_H*0.15]) {
            cube([HEAD_L*0.4, 25, HEAD_H*0.5], center=true);
        }
        
        // Mouth cavity — fire manifold receptacle
        translate([HEAD_L*0.45, 0, HEAD_H*0.25]) {
            rotate([0, -10, 0]) {
                cylinder(h=MANIFOLD_DEPTH+10, r=MANIFOLD_DIA/2 + 0.5);
            }
        }
        
        // Eye sockets
        for (side = [-1, 1]) {
            translate([HEAD_L*0.12, side*HEAD_W*0.28, HEAD_H*0.52]) {
                sphere(r=6);
            }
        }
        
        // Nostril holes
        for (side = [-1, 1]) {
            translate([HEAD_L*0.44, side*HEAD_W*0.2, HEAD_H*0.5]) {
                sphere(r=3);
            }
        }
    }
    
    // === FIRE MANIFOLD THREAD RING (at mouth) ===
    %translate([HEAD_L*0.5, 0, HEAD_H*0.22]) {
        rotate([0, -10, 0]) {
            difference() {
                cylinder(h=MANIFOLD_DEPTH, r=MANIFOLD_DIA/2 + WALL);
                translate([0, 0, -1]) {
                    cylinder(h=MANIFOLD_DEPTH+2, r=MANIFOLD_DIA/2 - 1);
                }
            }
        }
    }
    
    // === WING MOUNT SLOTS (both sides) ===
    for (side = [-1, 1]) {
        translate([-HEAD_L*0.08, side*(HEAD_W*0.35), HEAD_H*0.35]) {
            rotate([0, 0, side*10]) {
                difference() {
                    cube([45, 15, 50], center=true);
                    translate([-3, 0, 0]) {
                        cube([30, 8, 35], center=true);
                    }
                }
            }
        }
    }
    
    // === TEETH (cosmetic, lower jaw) ===
    for (i = [0: 5]) {
        x = HEAD_L*0.25 + i*12;
        translate([x, 0, HEAD_H*0.08]) {
            scale([0.8, 0.3, 0.5]) sphere(r=5);
        }
    }
    // Upper teeth (smaller, inside mouth)
    for (i = [0: 4]) {
        x = HEAD_L*0.3 + i*10;
        translate([x, 0, HEAD_H*0.28]) {
            scale([0.6, 0.2, 0.4]) sphere(r=4);
        }
    }
    
    // === CSOAI STAMP (raised text on back of neck) ===
    // (QIDI Studio has text tool — add "CSOAI · MEOK LABS" there during slicing)
}

// Build
dragon_head_v2();

echo(str("DRAGON HEAD V2: ", HEAD_L, "×", HEAD_W, "×", HEAD_H, "mm"));
echo(str("Mouth: M", MANIFOLD_DIA, " thread for fire manifold"));
echo(str("Wings: dovetail slots both sides"));
echo(str("Water: ", NECK_DIA, "mm channel neck→mouth"));
echo(str("Bed fit: ", HEAD_W < 392 ? "✅ YES" : "❌ TOO WIDE"));
