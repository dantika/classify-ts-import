// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// Helpers
import { ImportHelper }      from './helpers/import.helper';
import { ConstructorHelper } from './helpers/constructor.helper';

// NOTE This method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context : vscode.ExtensionContext)
{

  console.log('The extension "angular-vscode-cleaner" is now active!');

  // The command has been defined in the package.json file
  // Now provide the implementation of the command with registerCommand
  // The commandId parameter must match the command field in package.json
  const disposableImportCleaner = vscode.commands.registerCommand('extension.importCleaner', () =>
  {
    // The code you place here will be executed every time your command is executed

    const editor = vscode.window.activeTextEditor;

    if (!editor)
    {
      vscode.window.showErrorMessage("No file is open, can't reorder imports");
      return;
    }

    const docText  = editor.document.getText();
    const allLines = docText.split('\n');

    let importFound : boolean = false;
    // let firstIndex  : number  = 0;
    let lastIndex   : number  = 0;

    for (let i = 0; i < allLines.length; i++)
    {
      const line        = allLines[i];
      const hasImport   = line.includes('import');
      const hasFrom     = line.includes('from');
      const hasLBracket = line.includes('{');
      const hasRBracket = line.includes('}');
      const hasAll      = line.includes('*');
      const hasAs       = line.includes('as');
      if ((hasImport && hasFrom) && (hasLBracket && hasRBracket || hasAll && hasAs))
      {
        if (importFound === false)
        {
          // firstIndex = i;
          importFound = true;
        }
        lastIndex = i;
      }
    }

    if (!importFound)
    {
      vscode.window.showErrorMessage("No import found, can't reorder");
      return;
    }

    const lines : string[] = [];
    for (let y = 0; y <= lastIndex; y++) // NOTE Can change 0 to firstIndex
      lines.push(allLines[y]);

    ImportHelper.cleanLines(lines);

    const maxNameLength = ImportHelper.getLongestModuleName(lines);

    ImportHelper.indentLines(lines, maxNameLength);

    // NOTE Order lines by fromValue
    lines.sort((a, b) =>
    {
      const fromA = ImportHelper.getFromValue(a);
      const fromB = ImportHelper.getFromValue(b);
      if (fromA < fromB)
        return -1;
      if (fromA > fromB)
        return 1;
      return 0; // NOTE Values must be equal
    });

    let classifiedLines : string[] = [];
    classifiedLines = ImportHelper.classifyLines(lines);
    const linesAsText = classifiedLines.join('\n');

    // NOTE Remove lines found from activeDocument
    editor.edit(editBuilder =>
    {
      const start = new vscode.Position(0, 0); // NOTE Can change the first 0 to firstIndex
      const end   = new vscode.Position(lastIndex, allLines[lastIndex].length);
      const rangeToDelete = new vscode.Range(start, end);
      editBuilder.delete(rangeToDelete);

      // NOTE Add new lines to activeDocument
      editBuilder.insert(start, linesAsText);
    });

  });

  const disposableConstructorCleaner = vscode.commands.registerCommand('extension.constructorCleaner', () =>
  {
    const editor = vscode.window.activeTextEditor;

    if (!editor)
    {
      vscode.window.showErrorMessage("No file is open, can't clean constructor");
      return;
    }

    const docText  = editor.document.getText();
    const allLines = docText.split('\n');

    let constructorFound : boolean = false;
    let firstIndex       : number  = 0;
    let lastIndex        : number  = 0;

    let totalLBracket    : number  = 0;

    for (let i = 0; i <= allLines.length; i++)
    {
      const line           = allLines[i];
      const hasConstructor = line.includes('constructor');
      const hasLBracket    = line.includes('{');
      const hasRBracket    = line.includes('}');
      if (hasConstructor)
      {
        constructorFound = true;
        firstIndex = i;
      }
      if (constructorFound && hasLBracket)
        totalLBracket++;
      if (constructorFound && hasRBracket)
        totalLBracket--;
      if (constructorFound && hasRBracket && totalLBracket === 0)
      { // NOTE Get the position of the last } after the first { position
        lastIndex = i;
        break;
      }
    }

    if (!constructorFound)
    {
      vscode.window.showErrorMessage("No constructor found, can't clean");
      return;
    }

    const lines : string[] = [];
    for (let x = firstIndex; x <= lastIndex + 1; x++)
      lines.push(allLines[x]);

    const joinedLines        : string = lines.join('\n');

    const betweenParenthesis : string = joinedLines.substring(joinedLines.indexOf('(') + 1, joinedLines.indexOf(')'));
    const betweenBrackets    : string = joinedLines.substring(joinedLines.indexOf('{') + 1, joinedLines.lastIndexOf('}'));

    const newConstructor = ConstructorHelper.createConstructorParameters(betweenParenthesis, betweenBrackets);

    // NOTE Remove lines found from activeDocument
    editor.edit(editBuilder =>
    {
      const start = new vscode.Position(firstIndex, 0);
      const end   = new vscode.Position(lastIndex, allLines[lastIndex].length);
      const rangeToDelete = new vscode.Range(start, end);
      editBuilder.delete(rangeToDelete);

      // NOTE Add new lines to activeDocument
      editBuilder.insert(start, newConstructor);
    });

  });

  let disposableComponentCleaner = vscode.commands.registerCommand('extension.componentCleaner', () =>
  {
    // TODO
  });

  context.subscriptions.push(disposableImportCleaner);
  context.subscriptions.push(disposableConstructorCleaner);
  context.subscriptions.push(disposableComponentCleaner);
}

// -------------------------------------------------------------------------------
// ---- NOTE Deactivate ---------------------------------------------------------
// -------------------------------------------------------------------------------

// NOTE This method is called when your extension is deactivated
export function deactivate() { }