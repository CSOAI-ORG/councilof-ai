# MEOK × OpenShell — Sovereign Edge Integration

OpenShell is the Linux Foundation Edge umbrella for cloud-native OS platforms
(StarlingX, Wind River, EVE, Zephyr, Akraino, LF Edge). MEOK OS layers its
sovereign AI substrate on top of OpenShell's edge orchestration so that every
sovereign edge node runs the same Care-First compliance plane.

## What lives here

| File | Role |
|------|------|
| `openshell-config.yaml` | 3-node Sovereign Edge cluster (control + 2 workers, StarlingX-style) |
| `meok-agent.yaml` | K8s DaemonSet that puts one MEOK agent on every edge node |
| `sovereignty-constraints.yaml` | PodSecurityStandards + Kyverno policies enforcing Care-First |
| `compliance-operator.yaml` | Watches 12 frameworks (EU AI Act, GDPR, HIPAA, SOC2, ISO 27001/42001, NIST AI RMF, PCI-DSS, ISO 21434, NIS2, Cyber Resilience Act, EU Accessibility Act) and emits signed compliance events |

## Design rules

1. **Care-First is a hard constraint** — every workload that runs in this
   cluster must declare a `meok.io/care-class` label (`carer`, `cared`, or
   `observer`) and a `meok.io/harm-budget` (numeric, µharm/decision).
2. **No covert side-channels** — egress is forced through the MEOK
   compliance gateway, sealed and signed.
3. **TPM-rooted identity** — every node attests via the MEOK BMC daemon
   (see `../meok-os-openbmc/`) before joining the cluster.
4. **BFT quorum** — control plane requires 2-of-3 quorum; 33 hives are
   coordinated through a sovereign BFT verifier.

## Quick start

```bash
# 1. Apply the cluster bootstrap
kubectl apply -f openshell-config.yaml

# 2. Install sovereignty policies
kubectl apply -f sovereignty-constraints.yaml

# 3. Roll out the MEOK agent
kubectl apply -f meok-agent.yaml

# 4. Activate the compliance operator
kubectl apply -f compliance-operator.yaml

# 5. Verify
kubectl get pods -n meok-system
kubectl get compliancescans -A
```

## License

Apache-2.0 (MEOK AI OS — sovereign, signed, attested).
