import * as vscode from 'vscode';

export class CompanionProvider implements vscode.TreeDataProvider<CompanionItem> {
    private _onDidChangeTreeData = new vscode.EventEmitter<CompanionItem | undefined>();
    readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

    getTreeItem(element: CompanionItem): vscode.TreeItem {
        return element;
    }

    getChildren(): Thenable<CompanionItem[]> {
        return Promise.resolve([
            new CompanionItem('Level 12 — Server Sentinel', 'Level', vscode.TreeItemCollapsibleState.None),
            new CompanionItem('EXP: 12,450 / 20,000', 'XP', vscode.TreeItemCollapsibleState.None),
            new CompanionItem('State: Focused', 'State', vscode.TreeItemCollapsibleState.None),
            new CompanionItem('Next Ability: Lv 15 (Refactor Suggestions)', 'Ability', vscode.TreeItemCollapsibleState.None),
        ]);
    }
}

class CompanionItem extends vscode.TreeItem {
    constructor(public readonly label: string, public readonly type: string, collapsibleState: vscode.TreeItemCollapsibleState) {
        super(label, collapsibleState);
        this.iconPath = type === 'Level' ? new vscode.ThemeIcon('star-full')
            : type === 'XP' ? new vscode.ThemeIcon('pulse')
            : type === 'State' ? new vscode.ThemeIcon('smiley')
            : new vscode.ThemeIcon('lightbulb');
    }
}
