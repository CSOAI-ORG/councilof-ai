# meok-sovereign-vrm-mcp

**12-General VRM avatar controller. The dragon runs itself. Sovereign by construction.**

## 5 tools

| Tool | What |
|---|---|
| `spawn_avatar` | Spawn a General avatar |
| `speak` | Speak with the General's voice |
| `gesture` | Perform a gesture |
| `save_pose` | Save current pose |
| `render` | Render the avatar in UE5 |

## 12 Generals

| # | Name | Role | Voice |
|---|---|---|---|
| 1 | Argus | watchdog | Watch. Report. Protect. |
| 2 | Scribe | compliance | Compliance is a covenant. |
| 3 | Shield | safety | Defense without offense. |
| 4 | Builder | architect | Architecture is a covenant with the future. |
| 5 | Abacus | quant | Number is a covenant. |
| 6 | Lex | legal | Law is sovereign. License is sovereign. |
| 7 | Scale | ethics | Balance is sovereign. Bias is not. |
| 8 | Crow | risk | Risk is sovereign. Knowledge is sovereign. |
| 9 | Gear | operations | Operations is a covenant with uptime. |
| 10 | Voice | comms | Communication is sovereign. Clarity is sovereign. |
| 11 | Owl | research | Research is sovereign. Wisdom is sovereign. |
| 12 | Dragon | sovereign | The dragon runs itself. Sovereign by construction. |

## Install
```
pip install meok-sovereign-vrm-mcp
```

## Usage
```python
from meok_sovereign_vrm_mcp import spawn_avatar, speak, gesture, save_pose, render

# Spawn the Dragon
avatar = spawn_avatar(12, position=[5.0, 5.0, 0.0])
sid = avatar["spawn_id"]

# Speak
speak(sid, "The dragon runs itself. Sovereign by construction.")

# Gesture + render
gesture(sid, "bow")
render(sid)
```

## License
MIT — CSOAI Ltd (UK 16939677)
