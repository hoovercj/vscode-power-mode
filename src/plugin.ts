import { TextDocumentChangeEvent, WorkspaceConfiguration, TextEditor } from 'vscode';

export interface PowermodeChangeTextDocumentEventData {
    /**
     * The current value of the user's combo
     */
    currentCombo: number;

    /**
     * The number of seconds until the combo times out
     */
    comboTimeout: number;

    /**
     * Whether the user has reached "Power Mode" or not
     */
    isPowermodeActive: boolean;

    /**
     * The active editor at the time of the event
     */
    activeEditor: TextEditor;
}

export interface Plugin<T = WorkspaceConfiguration> {
    /**
     * Called when the extension is disposed and the plugin should cleanup. Remove all decorations, clear all timers, unsubscribe from all vscode api events, etc.
     */
    dispose(): void;

    /**
     * Called when "Power Mode" starts. Power Mode starts when the combo reaches a certain threshold. Plugins can do things before this point,
     * but should avoid doing the "big, flashy" things until Power Mode activates.
     * For example, a combo meter may show plain text before Power Mode activates, then show coloful, animated text afterwards.
     * @param currentCombo The current combo value
     */
    onPowermodeStart(currentCombo: number): void;

    /**
     * Called when "Power Mode" ends. Plugins should remove any features that they reserve for Power Mode, such as extra colors or animations.
     * @param finalCombo The combo value at the time that powermode stopped before it is reset.
     */
    onPowermodeStop(finalCombo: number): void;

    /**
     * Called when the user's combo breaks. This often occurs at the same time as onPowermodeStop, but can also be called when the combo ends and Power Mode was not started.
     * @param finalCombo The combo value at the time that the combo stopped before it is reset.
     */
    onComboStop(finalCombo: number)

    /**
     * Called when the document changed, meaning the user typed a character or did some other action to modify the content.
     * @param currentCombo The current combo value
     * @param isPowermode Whether Power Mode has started or not
     * @param event The underlying vscode.TextDocumentChangeEvent
     */
    onDidChangeTextDocument(data: PowermodeChangeTextDocumentEventData, event: TextDocumentChangeEvent): void;

    /**
     * Called when the configuration changes. Plugins are expected to respect user configuration, and can provide their own configuration options.
     * @param powermodeConfig The Power Mode extension configuration
     */
    onDidChangeConfiguration(powermodeConfig: T): void;
}