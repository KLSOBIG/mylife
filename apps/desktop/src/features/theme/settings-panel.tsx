import { themes, type ThemeName } from "../../lib/task-state";

export type ThemeSettings = {
  accentColor: string;
  backgroundColor: string;
};

const themeLabels: Record<ThemeName, string> = {
  olive: "苔绿",
  amber: "赤陶",
  slate: "石板"
};

export function SettingsPanel({
  open,
  preset,
  settings,
  onToggle,
  onPresetChange,
  onSettingsChange,
  onOpenWidget
}: {
  open: boolean;
  preset: ThemeName;
  settings: ThemeSettings;
  onToggle: () => void;
  onPresetChange: (preset: ThemeName) => void;
  onSettingsChange: (settings: ThemeSettings) => void;
  onOpenWidget?: () => void;
}) {
  return (
    <div className="settings-panel">
      {open ? (
        <section
          id="theme-settings-panel"
          className="settings-panel__sheet"
          role="dialog"
          aria-label="主题设置"
        >
          <div className="settings-panel__summary">
            <span className="settings-panel__dot" style={{ backgroundColor: settings.accentColor }} />
            <div>
              <p className="settings-panel__summary-label">当前主题</p>
              <strong>{themeLabels[preset]}</strong>
            </div>
          </div>
          <div className="settings-panel__group">
            <p className="settings-panel__label">主题预设</p>
            <div className="settings-panel__preset-list">
              {themes.map((theme) => (
                <button
                  key={theme}
                  type="button"
                  className={preset === theme ? "settings-panel__preset is-active" : "settings-panel__preset"}
                  onClick={() => onPresetChange(theme)}
                >
                  {themeLabels[theme]}
                </button>
              ))}
            </div>
          </div>

          <div className="settings-panel__group">
            <label className="settings-panel__field">
              <span>强调色</span>
              <div className="settings-panel__color-row">
                <input
                  type="color"
                  value={settings.accentColor}
                  onChange={(event) =>
                    onSettingsChange({
                      ...settings,
                      accentColor: event.target.value
                    })
                  }
                />
                <code>{settings.accentColor}</code>
              </div>
            </label>
            <label className="settings-panel__field">
              <span>背景色</span>
              <div className="settings-panel__color-row">
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(event) =>
                    onSettingsChange({
                      ...settings,
                      backgroundColor: event.target.value
                    })
                  }
                />
                <code>{settings.backgroundColor}</code>
              </div>
            </label>
          </div>
          <div className="settings-panel__group">
            <p className="settings-panel__label">桌面小窗</p>
            <button type="button" className="settings-panel__widget-button" onClick={onOpenWidget}>
              打开今天进行中小窗
            </button>
          </div>
        </section>
      ) : null}
      <button
        type="button"
        className="settings-panel__trigger"
        aria-controls="theme-settings-panel"
        aria-expanded={open ? "true" : "false"}
        onClick={onToggle}
      >
        设置
      </button>
    </div>
  );
}
