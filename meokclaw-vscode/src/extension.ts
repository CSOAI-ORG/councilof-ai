import * as vscode from 'vscode';
import { CompanionProvider } from './companionProvider';
import { CouncilProvider } from './councilProvider';
import { ModelRouter } from './modelRouter';

export function activate(context: vscode.ExtensionContext) {
    console.log('MEOKCLAW activated');

    // Register tree data providers
    const companionProvider = new CompanionProvider();
    const councilProvider = new CouncilProvider();
    
    vscode.window.registerTreeDataProvider('meokclaw.companion', companionProvider);
    vscode.window.registerTreeDataProvider('meokclaw.council', councilProvider);

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('meokclaw.toggleCouncil', () => {
            councilProvider.toggleVisibility();
        }),
        vscode.commands.registerCommand('meokclaw.switchModel', async () => {
            const model = await vscode.window.showQuickPick(
                ModelRouter.listModels(),
                { placeHolder: 'Select AI model...' }
            );
            if (model) {
                ModelRouter.setActiveModel(model);
                vscode.window.showInformationMessage(`MEOKCLAW: Switched to ${model}`);
            }
        }),
        vscode.commands.registerCommand('meokclaw.companionChat', () => {
            const panel = vscode.window.createWebviewPanel(
                'meokclawChat',
                'MEOKCLAW Companion',
                vscode.ViewColumn.Beside,
                { enableScripts: true }
            );
            panel.webview.html = getCompanionWebviewContent();
        }),
        vscode.commands.registerCommand('meokclaw.generateTests', () => {
            vscode.window.showInformationMessage('MEOKCLAW: Generating tests...');
        })
    );
}

function getCompanionWebviewContent(): string {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: system-ui; padding: 20px; background: #0f172a; color: white; }
        .companion { text-align: center; font-size: 48px; margin: 20px; }
        .level { color: #64748b; font-size: 14px; }
        .xp-bar { width: 200px; height: 8px; background: #1e293b; border-radius: 4px; margin: 10px auto; }
        .xp-fill { height: 100%; width: 65%; background: #3b82f6; border-radius: 4px; }
        .chat { margin-top: 30px; }
        .chat input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid #334155; background: #1e293b; color: white; }
    </style>
</head>
<body>
    <div class="companion">[^_^]</div>
    <div class="level">Lv. 12 — Server Sentinel</div>
    <div class="xp-bar"><div class="xp-fill"></div></div>
    <div style="text-align:center;color:#94a3b8;font-size:12px">EXP: 12,450 / 20,000</div>
    <div class="chat">
        <input type="text" placeholder="Ask your companion..." />
    </div>
</body>
</html>`;
}

export function deactivate() {}
