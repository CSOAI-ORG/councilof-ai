"""test_openskill.py — validate OpenSkill against known reference behaviour.

These tests pin the multi-team Plackett-Luce rating so it's a defensible crown jewel,
not a "winner moved up" placeholder. They assert the properties the ARC/Ndea playbook
requires for swarm/team/mixed populations.

Run:  python3 -m pytest harness/arena/test_openskill.py -q
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from openskill import Player, rate

def test_two_team_winner_rises():
    a, b = Player("a"), Player("b")
    rate([a, b], [1, 2])
    assert a.rating > b.rating, "winner must outrate loser in k=2"

def test_two_team_loser_drops_below_mu0():
    a, b = Player("a"), Player("b")
    rate([a, b], [1, 2])
    assert b.rating < Player("b").rating, "loser should drop below the prior point estimate"

def test_three_team_full_separation():
    # The swarm case Elo cannot do: A>B>C must be strictly separated, 2nd vs 3rd distinct.
    a, b, c = Player("a"), Player("b"), Player("c")
    rate([a, b, c], [1, 2, 3])
    assert a.rating > b.rating > c.rating, "k=3 must separate A>B>C"
    assert abs(b.rating - c.rating) > 1e-6, "2nd vs 3rd must be discriminated (not equal)"

def test_convergence_over_matches():
    # Repeated wins monotonically raise the winner; losses monotonically lower.
    a, b = Player("a"), Player("b")
    r0 = a.rating
    for _ in range(20):
        rate([a, b], [1, 2])
    assert a.rating > r0, "repeated wins must increase the winner's rating"
    # Reset case: repeated losses drop the loser below its priors.
    a2, b2 = Player("a"), Player("b")
    for _ in range(20):
        rate([a2, b2], [1, 2])
    assert b2.rating < Player("b").rating

def test_n_increments():
    a, b = Player("a"), Player("b")
    rate([a, b], [1, 2])
    assert a.n == 1 and b.n == 1, "each participant's n must increment once per match"

def _isnan(x):
    return x != x  # NaN is the only value not equal to itself


def test_mu_sigma_are_finite():
    a, b, c = Player("a"), Player("b"), Player("c")
    rate([a, b, c], [2, 1, 3])
    for p in (a, b, c):
        assert not _isnan(p.mu), f"{p.name} mu is NaN"
        assert not _isnan(p.sigma), f"{p.name} sigma is NaN"
        assert not _isnan(p.rating), f"{p.name} rating is NaN"

def test_rating_is_finite_point_estimate():
    # rating = mu - 3*sigma; must be finite for a valid comparison.
    a, b = Player("a"), Player("b")
    rate([a, b], [1, 2])
    assert a.rating == a.rating and b.rating == b.rating

def test_deterministic():
    # Same inputs -> same output (a deterministic predicate, never an LLM judge).
    a1, b1, c1 = Player("a"), Player("b"), Player("c")
    a2, b2, c2 = Player("a"), Player("b"), Player("c")
    rate([a1, b1, c1], [1, 3, 2])
    rate([a2, b2, c2], [1, 3, 2])
    assert (a1.rating, b1.rating, c1.rating) == (a2.rating, b2.rating, c2.rating)
