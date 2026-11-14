# M2 access to the existing M4 Condor dashboard

Verified 19 September 2026 at approximately 16:32 UTC.
Before this change: M4 localhost:8088 returned HTTP 200; M2 had no listener there.
After this change: M2 localhost:8088 is an SSH forward to M4 localhost:8088.
M2 HTTP readback returned 200 and Chrome's tab title was Condor.
This is ONE Condor service, not a second Condor deployment on M2.
The fleet_status tool's M2 Condor HTTP result now observes this forwarded M4 service.
Do not count those two successful HTTP reads as two independent services.

Connection: existing SSH identity and strict existing host-key verification.
M2 bind: 127.0.0.1:8088 only; no LAN/public listener was opened.
M4 application bind and authentication were unchanged.
No credentials were read, copied, reset or submitted. No trading action was taken.

M2 Desktop shortcut: Open Condor on M2.command.
Script is in this workspace; the Desktop entry is a symlink, not a duplicate.
The launcher reuses the existing tunnel and checks HTTP 200 before opening Chrome.
M4 must remain awake, network-reachable and running Condor.
No login-start scheduler or auto-reconnect daemon was installed.
The authenticated dashboard and actual bot execution remain separate acceptance checks.

To close only this forwarding connection, use:
ssh -S /Users/iokfarm/workspace_for_ai/csoai-fleet-observer-20260919/condor-ui.sock -O exit nicholas@NICHOLASs-MacBook-Air-2.local
This closes the tunnel, not Condor or any bot on M4.
