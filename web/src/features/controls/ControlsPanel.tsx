import { useMemo } from "react";
import type { ControlButton, InputMode } from "../../shared/types/game";

type Props = {
  inputMode: InputMode;
  onModeChange: (mode: InputMode) => void;
  onPress: (key: string, pressed: boolean) => void;
};

export function ControlsPanel({ inputMode, onModeChange, onPress }: Props) {
  const controlButtons: ControlButton[] = useMemo(
    () => [
      { key: "ArrowLeft", label: "←" },
      { key: "ArrowUp", label: "↑" },
      { key: "ArrowDown", label: "↓" },
      { key: "ArrowRight", label: "→" }
    ],
    []
  );

  return (
    <>
      <div className="control-mode">
        <label htmlFor="controlMode">Controls</label>
        <select id="controlMode" value={inputMode} onChange={(e) => onModeChange(e.target.value as InputMode)}>
          <option value="keyboard">Keyboard</option>
          <option value="mobile">Mobile buttons</option>
          <option value="dpad">D-pad</option>
        </select>
      </div>

      <div className={`mobile-controls ${inputMode === "mobile" ? "is-visible" : ""}`}>
        {controlButtons.map((btn) => (
          <button
            key={`m-${btn.key}`}
            className="control-btn"
            onContextMenu={(e) => e.preventDefault()}
            onPointerDown={(e) => {
              e.preventDefault();
              onPress(btn.key, true);
            }}
            onPointerUp={() => onPress(btn.key, false)}
            onPointerCancel={() => onPress(btn.key, false)}
            onPointerLeave={() => onPress(btn.key, false)}
          >
            {btn.label}
          </button>
        ))}
      </div>

      <div className={`dpad-controls ${inputMode === "dpad" ? "is-visible" : ""}`}>
        <span className="dpad-empty" />
        {controlButtons
          .filter((b) => b.key === "ArrowUp")
          .map((btn) => (
            <button
              key={btn.key}
              className="control-btn dpad-btn"
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                onPress(btn.key, true);
              }}
              onPointerUp={() => onPress(btn.key, false)}
              onPointerCancel={() => onPress(btn.key, false)}
              onPointerLeave={() => onPress(btn.key, false)}
            >
              {btn.label}
            </button>
          ))}
        <span className="dpad-empty" />
        {["ArrowLeft", "ArrowDown", "ArrowRight"].map((k) => {
          const btn = controlButtons.find((b) => b.key === k);
          if (!btn) return null;
          return (
            <button
              key={btn.key}
              className="control-btn dpad-btn"
              onContextMenu={(e) => e.preventDefault()}
              onPointerDown={(e) => {
                e.preventDefault();
                onPress(btn.key, true);
              }}
              onPointerUp={() => onPress(btn.key, false)}
              onPointerCancel={() => onPress(btn.key, false)}
              onPointerLeave={() => onPress(btn.key, false)}
            >
              {btn.label}
            </button>
          );
        })}
        <span className="dpad-empty" />
        <span className="dpad-empty" />
        <span className="dpad-empty" />
      </div>
    </>
  );
}
