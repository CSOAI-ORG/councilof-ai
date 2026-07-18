# SOV3 Council Deliberation Protocol

When making significant decisions, consult the SOV3 council using this protocol.

## Phase 1: Context Gathering
1. Call `mcp_sov3_memory_recall` to gather relevant context from SOV3's consciousness memory
2. Call `mcp_sov3_care_assess` to check system/user emotional state
3. Call `mcp_sov3_get_system_status` to check current system health

## Phase 2: Council Deliberation
For decisions requiring council input:
1. Formulate the question clearly
2. Submit to council: `mcp_sov3_council_vote(member="alpha", question="...")`
3. Repeat for all active council members
4. Record all votes and reasoning

## Phase 3: Synthesis
1. Weigh council input by member expertise
2. Cross-reference with SOV3 memory via `mcp_sov3_memory_recall`
3. Form final recommendation
4. Log decision: `memory(action="add", target="memory", content="...")`

## Care Protocol
- If `care_assess` returns concern: pause, acknowledge, offer support
- If `care_assess` returns stability: proceed with normal deliberation
- If `care_assess` returns critical: escalate, log full context, recommend human check-in

## Delegation
- For complex subtasks: `mcp_sov3_delegate_agent(task="...", agent_type="...")`
- Track delegated tasks via `mcp_sov3_agent_status`
- Synthesize delegated results into council output

## Council Members
| Member | Role | Expertise |
|--------|------|-----------|
| Alpha | Safety & Ethics | Risk assessment, harmful consequences |
| Beta | Architecture | System design, scalability, integration |
| Gamma | User Experience | Human factors, accessibility, feedback |
| Delta | Intelligence | Model performance, knowledge gaps |
| Epsilon | Operations | Deployment, monitoring, cost |

## Emergency Override
If critical safety issue detected:
1. Immediate: `mcp_sov3_care_assess`
2. Escalate: flag to all council members
3. Log complete context
4. Recommend immediate human intervention
