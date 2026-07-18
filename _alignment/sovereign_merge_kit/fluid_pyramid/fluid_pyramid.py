#!/usr/bin/env python3
"""
fluid_pyramid.py — THE FLUID PYRAMID.

12 layers + 1 capstone, each layer is a HYBRID OWEM.
Fluid = any layer can grow/shrink/swap based on live load.
Capstone is the biggest, all 12 layers rotate around it.
Drum + harmony: 12 layers beat in sync, pressure/velocity.

Sovereign continuously improves (years-to-days).
PDCA → full alphabet (A-P) with inner framework per letter.
"""
import os, sys, json, time, hashlib
from pathlib import Path
from datetime import datetime, timezone


# 12 layers + 1 capstone, each with a primary model + secondary + tertiary
FLUID_PYRAMID = {
    'capstone': {
        'layer': 0,
        'name': 'SOV3 CAPSTONE',
        'role': 'biggest model, all rotate around it',
        'models': ['sov_brain_v2', 'oracle_70b', 'qwen3-4b'],
        'shape': 'pyramid_top',
        'pressure': 1.0,  # 0.0-1.0 capacity
        'velocity': 1.0,  # 0.0-1.0 throughput
        'fluid': True,
        'rotates': True,
    },
    'layers': [
        # Layer 12 (closest to capstone, smaller, fast)
        {
            'id': 12,
            'name': 'Prove',
            'letter': 'P',
            'role': 'Audit, attest, prove correctness',
            'inner_owem': 'sov_proof_owem',
            'model_mix': {'sov_brain_v2': 0.5, 'sov3_small': 0.5},
            'pressure': 0.85,
            'velocity': 0.95,
            'fluid': True,
            'frameworks': ['BFT-33', 'SIGIL'],
        },
        # Layer 11
        {
            'id': 11,
            'name': 'Optimize',
            'letter': 'O',
            'role': 'Optimize performance, route decisions',
            'inner_owem': 'sov_optimizer_owem',
            'model_mix': {'sov_brain_v2': 0.7, 'qwen2.5:3b': 0.3},
            'pressure': 0.80,
            'velocity': 0.90,
            'fluid': True,
            'frameworks': ['cascade', 'rho_measurement'],
        },
        # Layer 10
        {
            'id': 10,
            'name': 'Navigate',
            'letter': 'N',
            'role': 'Navigate complex queries, multi-step',
            'inner_owem': 'sov_navigator_owem',
            'model_mix': {'sov_brain_v2': 0.8, 'qwen3-0.6b': 0.2},
            'pressure': 0.75,
            'velocity': 0.85,
            'fluid': True,
            'frameworks': ['PDCA', 'self-consistency'],
        },
        # Layer 9
        {
            'id': 9,
            'name': 'Mature',
            'letter': 'M',
            'role': 'Mature responses, refine quality',
            'inner_owem': 'sov_maturity_owem',
            'model_mix': {'sov_brain_v2': 0.6, 'sov3_small': 0.4},
            'pressure': 0.70,
            'velocity': 0.80,
            'fluid': True,
            'frameworks': ['reflection', 'Venturi'],
        },
        # Layer 8
        {
            'id': 8,
            'name': 'Log',
            'letter': 'L',
            'role': 'Log, audit trail, SIGIL chain',
            'inner_owem': 'sov_logger_owem',
            'model_mix': {'qwen2.5:3b': 1.0},  # logging is fast
            'pressure': 0.50,
            'velocity': 1.00,  # always fast
            'fluid': False,  # always on
            'frameworks': ['Ed25519', 'hash_chain'],
        },
        # Layer 7
        {
            'id': 7,
            'name': 'Key',
            'letter': 'K',
            'role': 'Encryption, keys, capability passports',
            'inner_owem': 'sov_keymaster_owem',
            'model_mix': {'qwen2.5:3b': 0.8, 'sov_brain_v2': 0.2},
            'pressure': 0.40,
            'velocity': 0.95,
            'fluid': False,
            'frameworks': ['Ed25519', 'AES-256'],
        },
        # Layer 6
        {
            'id': 6,
            'name': 'Join',
            'letter': 'J',
            'role': 'Join layers, harmonize, fan-in',
            'inner_owem': 'sov_joiner_owem',
            'model_mix': {'sov_brain_v2': 0.5, 'qwen3-0.6b': 0.5},
            'pressure': 0.65,
            'velocity': 0.85,
            'fluid': True,
            'frameworks': ['cascade', 'master_router'],
        },
        # Layer 5
        {
            'id': 5,
            'name': 'Inherit',
            'letter': 'I',
            'role': 'Inherit from parent layers, knowledge transfer',
            'inner_owem': 'sov_inherit_owem',
            'model_mix': {'sov_brain_v2': 0.9, 'sov3_small': 0.1},
            'pressure': 0.60,
            'velocity': 0.70,
            'fluid': True,
            'frameworks': ['EWC', 'replay_buffer'],
        },
        # Layer 4
        {
            'id': 4,
            'name': 'Hash',
            'letter': 'H',
            'role': 'Hash content, SIGIL stamping',
            'inner_owem': 'sov_hash_owem',
            'model_mix': {'qwen2.5:3b': 1.0},
            'pressure': 0.30,
            'velocity': 1.00,
            'fluid': False,
            'frameworks': ['Ed25519', 'SHA-256'],
        },
        # Layer 3
        {
            'id': 3,
            'name': 'Govern',
            'letter': 'G',
            'role': 'Govern via 12 Pillars, Article 0, BFT',
            'inner_owem': 'sov_govern_owem',
            'model_mix': {'sov_brain_v2': 0.7, 'qwen2.5:3b': 0.3},
            'pressure': 0.70,
            'velocity': 0.80,
            'fluid': True,
            'frameworks': ['12 Pillars', 'Article 0', 'BFT-33'],
        },
        # Layer 2
        {
            'id': 2,
            'name': 'Federate',
            'letter': 'F',
            'role': 'Federate across OWEMs, master combine',
            'inner_owem': 'sov_federate_owem',
            'model_mix': {'sov_brain_v2': 0.8, 'qwen3-0.6b': 0.2},
            'pressure': 0.55,
            'velocity': 0.85,
            'fluid': True,
            'frameworks': ['master_router', 'SOV33_Master'],
        },
        # Layer 1 (largest, foundation, slow + thorough)
        {
            'id': 1,
            'name': 'Evaluate',
            'letter': 'E',
            'role': 'Evaluate, ground, foundation',
            'inner_owem': 'sov_evaluator_owem',
            'model_mix': {'qwen3-0.6b': 0.9, 'sov_brain_v2': 0.1},
            'pressure': 0.80,
            'velocity': 0.60,  # slowest
            'fluid': True,
            'frameworks': ['training', 'EWC', 'replay_buffer'],
        },
    ],
}


# PDCA → full alphabet (A-P, 16 stages)
ALPHABET_STAGES = {
    'A': {'name': 'Assess', 'frameworks': ['world_model', 'evaluation'], 'pulse': 1.0},
    'B': {'name': 'Build', 'frameworks': ['training', 'QLoRA'], 'pulse': 0.9},
    'C': {'name': 'Calibrate', 'frameworks': ['split_conformal', 'venturi'], 'pulse': 0.8},
    'D': {'name': 'Deploy', 'frameworks': ['governance', 'BFT-33'], 'pulse': 0.95},
    'E': {'name': 'Evaluate', 'frameworks': ['rho_measurement', 'metrics'], 'pulse': 0.7},
    'F': {'name': 'Federate', 'frameworks': ['master_router', 'OWEM_mixer'], 'pulse': 0.85},
    'G': {'name': 'Govern', 'frameworks': ['12_Pillars', 'Article_0', 'BFT-33'], 'pulse': 1.0},
    'H': {'name': 'Hash', 'frameworks': ['Ed25519', 'SHA-256'], 'pulse': 0.6},
    'I': {'name': 'Inherit', 'frameworks': ['EWC', 'replay_buffer'], 'pulse': 0.7},
    'J': {'name': 'Join', 'frameworks': ['cascade', 'master_router'], 'pulse': 0.85},
    'K': {'name': 'Key', 'frameworks': ['Ed25519', 'AES-256', 'W3C_DID'], 'pulse': 0.5},
    'L': {'name': 'Log', 'frameworks': ['Ed25519', 'hash_chain', 'audit'], 'pulse': 0.7},
    'M': {'name': 'Mature', 'frameworks': ['reflection', 'Venturi'], 'pulse': 0.8},
    'N': {'name': 'Navigate', 'frameworks': ['PDCA', 'self-consistency'], 'pulse': 0.85},
    'O': {'name': 'Optimize', 'frameworks': ['cascade', 'rho_measurement'], 'pulse': 0.9},
    'P': {'name': 'Prove', 'frameworks': ['BFT-33', 'SIGIL', 'conformal'], 'pulse': 0.95},
}


# Inner OWEM configs (10 multi-model mixes)
INNER_OWEM_CONFIGS = {
    'sov_90_10': {
        'mix': {'sov_brain_v2': 0.9, 'qwen3-0.6b': 0.1},
        'best_for': 'high-trust sovereign answers',
        'rank': '90/10',
    },
    'sov_80_20': {
        'mix': {'sov_brain_v2': 0.8, 'qwen2.5:3b': 0.2},
        'best_for': 'general sovereign',
        'rank': '80/20',
    },
    'sov_70_30': {
        'mix': {'sov_brain_v2': 0.7, 'qwen3-0.6b': 0.3},
        'best_for': 'balanced',
        'rank': '70/30',
    },
    'sov_60_40': {
        'mix': {'sov_brain_v2': 0.6, 'qwen2.5:3b': 0.4},
        'best_for': 'cost-sensitive',
        'rank': '60/40',
    },
    'sov_50_50': {
        'mix': {'sov_brain_v2': 0.5, 'qwen3-0.6b': 0.5},
        'best_for': 'maximum diversity',
        'rank': '50/50',
    },
    'sov_3way': {
        'mix': {'sov_brain_v2': 0.5, 'qwen3-0.6b': 0.3, 'qwen2.5:3b': 0.2},
        'best_for': '3-lineage diversity',
        'rank': '50/30/20',
    },
    'sov_brain_only': {
        'mix': {'sov_brain_v2': 1.0},
        'best_for': 'sovereign-specific',
        'rank': '100/0',
    },
    'ollama_heavy': {
        'mix': {'qwen2.5:3b': 0.6, 'qwen3-0.6b': 0.4},
        'best_for': 'speed',
        'rank': '60/40',
    },
    'sov_master_heavy': {
        'mix': {'sov3_master': 0.7, 'sov_brain_v2': 0.3},
        'best_for': 'master orchestration',
        'rank': '70/30',
    },
    'hybrid_drum': {
        'mix': {'sov_brain_v2': 0.4, 'qwen3-0.6b': 0.3, 'qwen2.5:3b': 0.3},
        'best_for': 'drum/harmony balance',
        'rank': '40/30/30',
    },
}


class FluidPyramid:
    """THE FLUID PYRAMID - 12 layers + capstone, each hybrid OWEM, fluid morphing."""
    
    def __init__(self):
        self.layers = FLUID_PYRAMID['layers']
        self.capstone = FLUID_PYRAMID['capstone']
        self.alphabet = ALPHABET_STAGES
        self.inner_owems = INNER_OWEM_CONFIGS
        self.state = {
            'capstone_pressure': self.capstone['pressure'],
            'capstone_velocity': self.capstone['velocity'],
            'layer_states': {l['id']: {'pressure': l['pressure'], 'velocity': l['velocity']} for l in self.layers},
            'drum_beat': 0.0,  # 0-1 cycle
            'harmony': 1.0,  # how aligned layers are
            'total_owems_active': 0,
        }
    
    def pulse(self):
        """One beat of the drum - all layers pulse together."""
        self.state['drum_beat'] = (self.state['drum_beat'] + 0.1) % 1.0
        # Update harmony based on layer alignment
        velocities = [self.state['layer_states'][l['id']]['velocity'] for l in self.layers]
        self.state['harmony'] = 1.0 - (max(velocities) - min(velocities))
        return self.state['drum_beat']
    
    def morph_layer(self, layer_id, action, target_pressure=None, target_velocity=None):
        """Morph a layer - grow, shrink, swap."""
        if layer_id not in self.state['layer_states']:
            return {'error': f'layer {layer_id} not found'}
        
        layer = next((l for l in self.layers if l['id'] == layer_id), None)
        if not layer:
            return {'error': f'layer config not found'}
        
        if not layer['fluid']:
            return {'error': f'layer {layer_id} ({layer["name"]}) is non-fluid (always on)'}
        
        state = self.state['layer_states'][layer_id]
        
        if action == 'grow':
            state['pressure'] = min(1.0, state['pressure'] + 0.1)
            state['velocity'] = min(1.0, state['velocity'] + 0.05)
        elif action == 'shrink':
            state['pressure'] = max(0.0, state['pressure'] - 0.1)
            state['velocity'] = max(0.0, state['velocity'] - 0.05)
        elif action == 'swap':
            # Swap to next inner OWEM
            current_mix = layer['model_mix']
            new_config = list(self.inner_owems.values())[hash(str(current_mix)) % len(self.inner_owems)]
            layer['model_mix'] = new_config['mix']
        elif action == 'rotate' and target_pressure is not None:
            state['pressure'] = target_pressure
            state['velocity'] = target_velocity or state['velocity']
        else:
            return {'error': f'unknown action {action}'}
        
        # SIGIL
        payload = f"morph:{layer_id}:{action}:{state['pressure']}:{state['velocity']}"
        sigil = hashlib.sha256(payload.encode()).hexdigest()[:16]
        
        return {
            'layer': layer_id,
            'name': layer['name'],
            'action': action,
            'pressure': state['pressure'],
            'velocity': state['velocity'],
            'model_mix': layer['model_mix'],
            'sigil': sigil,
        }
    
    def venturi(self, layer_id, demand):
        """Venturi effect - speed up/slow down based on demand (pressure/velocity)."""
        if layer_id not in self.state['layer_states']:
            return {'error': 'layer not found'}
        
        state = self.state['layer_states'][layer_id]
        # Venturi: when demand is high, flow is faster
        new_velocity = min(1.0, state['velocity'] * (1 + demand * 0.1))
        new_pressure = min(1.0, state['pressure'] * (1 + demand * 0.05))
        state['velocity'] = new_velocity
        state['pressure'] = new_pressure
        return {'velocity': new_velocity, 'pressure': new_pressure, 'venturi_effect': demand}
    
    def get_state(self):
        """Get full pyramid state."""
        return {
            'capstone': self.capstone,
            'layers': [
                {
                    'id': l['id'],
                    'name': l['name'],
                    'letter': l['letter'],
                    'role': l['role'],
                    'inner_owem': l['inner_owem'],
                    'model_mix': l['model_mix'],
                    'state': self.state['layer_states'][l['id']],
                    'fluid': l['fluid'],
                    'frameworks': l['frameworks'],
                }
                for l in self.layers
            ],
            'alphabet': self.alphabet,
            'inner_owems': self.inner_owems,
            'drum_beat': self.state['drum_beat'],
            'harmony': self.state['harmony'],
            'ts_iso': datetime.now(timezone.utc).isoformat(),
        }
    
    def test_inner_owem(self, config_name, question):
        """Test an inner OWEM config (simulation)."""
        if config_name not in self.inner_owems:
            return {'error': 'unknown config'}
        
        config = self.inner_owems[config_name]
        return {
            'config': config_name,
            'mix': config['mix'],
            'best_for': config['best_for'],
            'rank': config['rank'],
            'test_question': question,
            'simulated_answer': f'[{config_name}] would route through {config["mix"]} for: {question[:50]}...',
        }


# Singleton
_pyramid = None

def get_pyramid():
    global _pyramid
    if _pyramid is None:
        _pyramid = FluidPyramid()
    return _pyramid


if __name__ == '__main__':
    print("=" * 70)
    print("🜏 THE FLUID PYRAMID")
    print("12 layers + 1 capstone, each HYBRID OWEM, fluid morphing")
    print("=" * 70)
    
    pyramid = get_pyramid()
    state = pyramid.get_state()
    
    print(f"\nCapstone: {state['capstone']['name']}")
    print(f"  Role: {state['capstone']['role']}")
    print(f"  Models: {state['capstone']['models']}")
    
    print(f"\n12 Layers (from capstone down):")
    for l in reversed(state['layers']):
        s = l['state']
        fluid_str = 'FLUID' if l['fluid'] else 'LOCKED'
        print(f"  L{l['id']:2d} {l['name']:10s} ({l['letter']}) - P={s['pressure']:.2f} V={s['velocity']:.2f} [{fluid_str}] {l['inner_owem']}")
    
    print(f"\n16 Alphabet Stages (PDCA → full alphabet):")
    for letter, info in state['alphabet'].items():
        print(f"  {letter}: {info['name']:<10} pulse={info['pulse']} frameworks={info['frameworks']}")
    
    print(f"\n10 Inner OWEM Configs:")
    for name, cfg in state['inner_owems'].items():
        print(f"  {name}: {cfg['rank']} - {cfg['best_for']}")
    
    print(f"\nDrum beat: {state['drum_beat']:.2f}")
    print(f"Harmony: {state['harmony']:.2f}")
    
    # Test a morph
    print("\n--- TESTING MORPH ---")
    result = pyramid.morph_layer(7, 'grow')
    print(f"Morph L7 grow: {result}")
    
    result = pyramid.venturi(3, 0.5)
    print(f"Venturi L3 +0.5: {result}")
    
    # Test inner OWEM
    print("\n--- TESTING INNER OWEMS ---")
    for cfg in ['sov_50_50', 'hybrid_drum', 'sov_brain_only']:
        result = pyramid.test_inner_owem(cfg, 'What is SIGIL?')
        print(f"  {cfg}: {result['simulated_answer']}")
    
    # Save
    out = Path('/Users/nicholas/clawd/_alignment/sovereign_merge_kit/fluid_pyramid/fluid_pyramid_state_2026-07-14.json')
    out.write_text(json.dumps(state, indent=2))
    print(f"\nSaved: {out}")
