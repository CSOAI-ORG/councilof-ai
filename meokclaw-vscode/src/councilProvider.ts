import * as vscode from 'vscode';

export class CouncilProvider implements vscode.TreeDataProvider<CouncilMember> {
    private visible = true;
    private _onDidChangeTreeData = new vscode.EventEmitter<CouncilMember | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    toggleVisibility() {
        this.visible = !this.visible;
        this._onDidChangeTreeData.fire(undefined);
        vscode.window.showInformationMessage(this.visible ? 'BFT Council: VISIBLE' : 'BFT Council: HIDDEN');
    }

    getTreeItem(element: CouncilMember): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<CouncilMember[]> {
        if (!this.visible) return Promise.resolve([]);
        return Promise.resolve([
            new CouncilMember('Claude 4 Sonnet', '✅ Approved (0.92)', 'pass'),
            new CouncilMember('GPT-5.5', '✅ Approved (0.88)', 'pass'),
            new CouncilMember('Gemini 3.1', '⚠️ Dissent (0.34)', 'warn'),
            new CouncilMember('DeepSeek V4', '✅ Approved (0.91)', 'pass'),
            new CouncilMember('Qwen3-Max', '✅ Approved (0.87)', 'pass'),
            new CouncilMember('Consensus: 87%', '', 'consensus'),
        ]);
    }
}

class CouncilMember extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly status: string, public readonly vote: string) {
        super(`${label} ${status ? '— ' + status : ''}`, vscode.TreeItemCollapsibleState.None);
        this.iconPath = vote === 'pass' ? new vscode.ThemeIcon('check')
            : vote === 'warn' ? new vscode.ThemeIcon('warning')
            : new vscode.ThemeIcon('law');
    }
}
