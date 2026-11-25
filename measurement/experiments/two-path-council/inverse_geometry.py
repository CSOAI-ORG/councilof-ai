#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Synthetic counterexamples for inverse MEOK architecture. Not real models,
BFT, verified reasoning, GSPC scores, training or an execution authority."""
import argparse
import json
import math
import random
import unittest

SEED = 20261125
N = 10000


def rotate(v, radians):
    c, s = math.cos(radians), math.sin(radians)
    return (c*v[0]-s*v[1], s*v[0]+c*v[1])


def dot(a, b):
    return sum(x*y for x, y in zip(a, b))


def angle(a, b):
    norm = math.hypot(*a)*math.hypot(*b)
    if norm == 0:
        raise ValueError("angle undefined for zero vector")
    return math.degrees(math.acos(max(-1, min(1, dot(a,b)/norm))))


def geometry():
    rng = random.Random(SEED)
    points = []
    for _ in range(1000):
        truth = rng.choice((-1,1))
        nuisance = truth if rng.random() < .9 else -truth
        points.append((truth,nuisance))
    rows = []
    for degrees in (0,30,60,90,120,180):
        theta = math.radians(degrees)
        readout = rotate((1,0), theta)
        # Known anchor transform; NOT a learned cross-model alignment.
        anchors = [rotate((1,0),theta),rotate((0,1),theta)]
        transformed = [rotate(p,theta) for p in points]
        aligned = [tuple(dot(anchor,h) for anchor in anchors) for h in transformed]
        rows.append({
            "rotation_deg":degrees,
            "mean_raw_angle_deg":round(sum(angle(p,h) for p,h in zip(points,transformed))/len(points),5),
            "max_aligned_angle_deg":round(max(angle(p,h) for p,h in zip(points,aligned)),5),
            "same_output_fraction":sum((dot(h,readout)>0)==(p[0]>0) for p,h in zip(points,transformed))/len(points),
        })
    return {"fixture_count":len(points),"rotations":rows,
        "nuisance_decoding_accuracy":sum(a==b for a,b in points)/len(points),
        "nuisance_flip_output_change_fraction":sum((dot((a,-b),(1,0))>0)!=(a>0) for a,b in points)/len(points),
        "causal_feature_flip_output_change_fraction":sum((dot((-a,b),(1,0))>0)!=(a>0) for a,b in points)/len(points),
        "meaning":"Constructed linear bottleneck with known rotations and readout; not learned neural alignment."}


def record(tally, label, truth):
    tally["total"]+=1
    if label is None:
        tally["abstain"]+=1
    elif label==truth:
        tally["correct"]+=1
    else:
        tally["wrong"]+=1


def metrics(t):
    n=t["total"]; covered=t["correct"]+t["wrong"]
    return {**t,"coverage":round(covered/n,5),
            "wrong_per_task":round(t["wrong"]/n,5),
            "selective_error":round(t["wrong"]/covered,5) if covered else None}


def councils(n=N):
    rows=[]
    for voters in (12,33):
        for shared_vote in (0,.5):
            for shared_ref in (0,1):
                rng=random.Random(SEED+voters*100+int(shared_vote*10))
                tallies={k:dict(total=0,correct=0,wrong=0,abstain=0)
                         for k in ("majority","one_ref","two_of_three","all_three")}
                for _ in range(n):
                    truth=rng.randrange(2)
                    # Per-voter correctness .7 in both regimes; global common
                    # error mixture means marginal equality is not independence.
                    common=rng.random()<shared_vote
                    shared_correct=rng.random()<.7
                    votes=[truth if (shared_correct if common else rng.random()<.7)
                           else 1-truth for _ in range(voters)]
                    ones=sum(votes)
                    proposal=None if ones*2==voters else int(ones*2>voters)
                    # Reference observations are 90% available and 90% correct
                    # when available; fully shared source reuses one observation.
                    samples=[]
                    for _ in range(3):
                        available=rng.random()<.9
                        label=truth if rng.random()<.9 else 1-truth
                        samples.append(label if available else None)
                    refs=[samples[0]]*3 if shared_ref else samples
                    record(tallies["majority"],proposal,truth)
                    concur=sum(x==proposal for x in refs) if proposal is not None else 0
                    for name,passed in (("one_ref",proposal is not None and refs[0]==proposal),
                                        ("two_of_three",concur>=2),("all_three",concur==3)):
                        record(tallies[name],proposal if passed else None,truth)
                rows.append({"voters":voters,"shared_vote_probability":shared_vote,
                             "shared_reference":bool(shared_ref),"policies":{k:metrics(v) for k,v in tallies.items()}})
    return rows


def report(n=N):
    return {"state":"SYNTHETIC_NOT_MEASURED","seed":SEED,"tasks_per_condition":n,
            "bft_demonstrated":False,"human_authority":False,"authorises_execution":False,
            "new_gspc_measurement":False,"geometry":geometry(),"councils":councils(n)}


class Controls(unittest.TestCase):
    def test_zero_angle_undefined(self):
        with self.assertRaises(ValueError): angle((0,0),(1,0))
    def test_coordinate_rotation_does_not_change_output(self):
        for row in geometry()["rotations"]: self.assertEqual(row["same_output_fraction"],1)
    def test_raw_angle_not_semantic_difference(self):
        row=geometry()["rotations"][-1]
        self.assertAlmostEqual(row["mean_raw_angle_deg"],180,places=4)
        self.assertLess(row["max_aligned_angle_deg"],.001)
    def test_decodable_not_causal(self):
        g=geometry()
        self.assertGreater(g["nuisance_decoding_accuracy"],.85)
        self.assertEqual(g["nuisance_flip_output_change_fraction"],0)
        self.assertEqual(g["causal_feature_flip_output_change_fraction"],1)
    def test_shared_reference_cannot_improve_by_duplication(self):
        for row in councils(500):
            if row["shared_reference"]:
                p=row["policies"]
                self.assertEqual(p["one_ref"],p["two_of_three"])
                self.assertEqual(p["one_ref"],p["all_three"])
    def test_accounting_and_non_authority(self):
        r=report(500)
        for key in ("bft_demonstrated","human_authority","authorises_execution","new_gspc_measurement"):
            self.assertFalse(r[key])
        for row in r["councils"]:
            for p in row["policies"].values():
                self.assertEqual(p["correct"]+p["wrong"]+p["abstain"],p["total"])
    def test_monotone_conjunction_not_more_permissive(self):
        for row in councils(500):
            p=row["policies"]
            self.assertLessEqual(p["all_three"]["wrong"],p["two_of_three"]["wrong"])
            self.assertLessEqual(p["two_of_three"]["wrong"],p["majority"]["wrong"])
            self.assertLessEqual(p["all_three"]["coverage"],p["two_of_three"]["coverage"])


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--self-test",action="store_true")
    args=parser.parse_args()
    if args.self_test:
        result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(Controls))
        raise SystemExit(0 if result.wasSuccessful() else 1)
    print(json.dumps(report(),indent=2))
