import { useMemo, useState } from "react";
import type { CityRunnerLevel, CityRunnerLevelEvent } from "../../games/city-runner/levelStore";
import { loadCityRunnerLevel, saveCityRunnerLevel } from "./cityRunnerLevelStorage";
import { useTranslation } from "react-i18next";
import { cityRunnerCampaignLevels } from "../campaign/cityRunnerCampaign";

type Props = {
  onBack: () => void;
  onPlay: (level: CityRunnerLevel) => void;
};

const sortEvents = (events: CityRunnerLevelEvent[]) => [...events].sort((a, b) => a.at - b.at);

const clampInt = (v: string, fallback: number) => {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(0, Math.floor(n));
};

const frameToSec = (frame: number) => Math.max(0, Math.round((frame / 60) * 100) / 100);
const secToFrame = (sec: string, fallbackFrame: number) => {
  const n = Number(sec);
  if (!Number.isFinite(n)) return fallbackFrame;
  return Math.max(0, Math.floor(n * 60));
};

export function LevelBuilderScreen({ onBack, onPlay }: Props) {
  const { t } = useTranslation();
  const [level, setLevel] = useState<CityRunnerLevel>(() => loadCityRunnerLevel());
  const [importExport, setImportExport] = useState<string>("");
  const events = useMemo(() => sortEvents(level.events), [level.events]);

  const updateEvent = (idx: number, next: CityRunnerLevelEvent) => {
    const copy = events.slice();
    copy[idx] = next;
    setLevel((prev) => ({ ...prev, events: copy }));
  };

  const removeEvent = (idx: number) => {
    const copy = events.slice();
    copy.splice(idx, 1);
    setLevel((prev) => ({ ...prev, events: copy }));
  };

  const addEvent = (evt: CityRunnerLevelEvent) => {
    setLevel((prev) => ({ ...prev, events: sortEvents([...prev.events, evt]) }));
  };

  const save = () => {
    const normalized: CityRunnerLevel = {
      ...level,
      durationSec: Math.max(8, Math.floor(level.durationSec)),
      checkpointsSec: [...level.checkpointsSec].filter((s) => s > 0).sort((a, b) => a - b),
      events: sortEvents(level.events)
    };
    setLevel(normalized);
    saveCityRunnerLevel(normalized);
  };

  const exportJson = () => {
    const normalized: CityRunnerLevel = { ...level, events: sortEvents(level.events) };
    setImportExport(JSON.stringify(normalized, null, 2));
  };

  const importJson = () => {
    try {
      const parsed = JSON.parse(importExport) as CityRunnerLevel;
      if (!parsed || parsed.version !== 1 || typeof parsed.title !== "string" || !Array.isArray(parsed.events)) return;
      setLevel({
        version: 1,
        title: parsed.title,
        durationSec: Math.max(8, Math.floor(parsed.durationSec ?? 60)),
        checkpointsSec: Array.isArray(parsed.checkpointsSec)
          ? parsed.checkpointsSec.filter((s) => Number.isFinite(s) && s > 0).map((s) => Math.floor(s)).sort((a, b) => a - b)
          : [],
        events: sortEvents(parsed.events)
      });
    } catch {
      // ignore
    }
  };

  return (
    <main className="screen builder-screen">
      <div className="builder-card">
        <div className="builder-topbar">
          <div>
            <h1>{t("levelBuilder.title")}</h1>
            <p className="hint">{t("levelBuilder.hint")}</p>
          </div>
          <div className="topbar-actions">
            <button onClick={onBack}>{t("common.back")}</button>
            <button
              onClick={() => {
                save();
                onPlay({ ...level, events });
              }}
            >
              {t("levelBuilder.play")}
            </button>
          </div>
        </div>

        <div className="builder-grid">
          <section className="builder-panel">
            <label className="builder-label">
              <span>{t("levelBuilder.levelTitle")}</span>
              <input
                value={level.title}
                onChange={(e) => setLevel((prev) => ({ ...prev, title: e.target.value }))}
                placeholder={t("levelBuilder.levelTitlePlaceholder")}
              />
            </label>

            <label className="builder-label">
              <span>{t("levelBuilder.finishSec")}</span>
              <input
                value={level.durationSec}
                inputMode="numeric"
                onChange={(e) => setLevel((prev) => ({ ...prev, durationSec: clampInt(e.target.value, prev.durationSec) }))}
              />
            </label>

            <label className="builder-label">
              <span>{t("levelBuilder.checkpoints")}</span>
              <input
                value={level.checkpointsSec.join(", ")}
                onChange={(e) => {
                  const next = e.target.value
                    .split(",")
                    .map((s) => Number(s.trim()))
                    .filter((n) => Number.isFinite(n) && n > 0)
                    .map((n) => Math.floor(n))
                    .sort((a, b) => a - b);
                  setLevel((prev) => ({ ...prev, checkpointsSec: next }));
                }}
                placeholder="15, 30, 45"
              />
            </label>

            <div className="builder-actions">
              <button onClick={save}>{t("common.save")}</button>
              <button onClick={exportJson}>{t("levelBuilder.export")}</button>
              <button onClick={importJson}>{t("levelBuilder.import")}</button>
            </div>

            <div className="builder-label">
              <span>Примеры уровней</span>
              <div className="builder-actions">
                {cityRunnerCampaignLevels.map((preset, idx) => (
                  <button
                    key={`preset-${idx}`}
                    onClick={() =>
                      setLevel({
                        version: 1,
                        title: preset.title,
                        durationSec: preset.durationSec,
                        checkpointsSec: [...preset.checkpointsSec],
                        events: sortEvents([...preset.events])
                      })
                    }
                  >
                    {idx + 1}. {preset.title}
                  </button>
                ))}
              </div>
            </div>

            <label className="builder-label">
              <span>{t("levelBuilder.json")}</span>
              <textarea value={importExport} onChange={(e) => setImportExport(e.target.value)} rows={10} />
            </label>
          </section>

          <section className="builder-panel">
            <h2>{t("levelBuilder.events")}</h2>
            <div className="builder-actions">
              <button onClick={() => addEvent({ at: 60, type: "ground", kind: "pipe" })}>{t("levelBuilder.add.pipe")}</button>
              <button onClick={() => addEvent({ at: 120, type: "ground", kind: "flower" })}>{t("levelBuilder.add.flower")}</button>
              <button onClick={() => addEvent({ at: 160, type: "brick" })}>{t("levelBuilder.add.brick")}</button>
              <button onClick={() => addEvent({ at: 220, type: "creature" })}>{t("levelBuilder.add.potato")}</button>
              <button onClick={() => addEvent({ at: 240, type: "flyer", kind: "bee" })}>{t("levelBuilder.add.bee")}</button>
              <button onClick={() => addEvent({ at: 260, type: "flyer", kind: "fly" })}>{t("levelBuilder.add.fly")}</button>
              <button onClick={() => addEvent({ at: 200, type: "star", kind: "invincible" })}>{t("levelBuilder.add.starInv")}</button>
              <button onClick={() => addEvent({ at: 200, type: "star", kind: "superJump" })}>{t("levelBuilder.add.starJump")}</button>
            </div>

            <div className="event-list">
              {events.length === 0 && <p className="hint">{t("levelBuilder.empty")}</p>}

              {events.map((evt, idx) => (
                <div key={`${evt.type}-${idx}-${evt.at}`} className="event-row">
                  <div className="event-cell">
                    <span className="event-label">{t("levelBuilder.timeSec")}</span>
                    <input
                      value={frameToSec(evt.at)}
                      inputMode="numeric"
                      onChange={(e) => updateEvent(idx, { ...evt, at: secToFrame(e.target.value, evt.at) } as CityRunnerLevelEvent)}
                    />
                  </div>

                  <div className="event-cell">
                    <span className="event-label">{t("levelBuilder.type")}</span>
                    <select
                      value={evt.type}
                      onChange={(e) => {
                        const t = e.target.value as CityRunnerLevelEvent["type"];
                        if (t === "ground") updateEvent(idx, { at: evt.at, type: "ground", kind: "pipe" });
                        if (t === "brick") updateEvent(idx, { at: evt.at, type: "brick" });
                        if (t === "creature") updateEvent(idx, { at: evt.at, type: "creature" });
                        if (t === "flyer") updateEvent(idx, { at: evt.at, type: "flyer", kind: "bee" });
                        if (t === "star") updateEvent(idx, { at: evt.at, type: "star", kind: "invincible" });
                      }}
                    >
                      <option value="ground">земля</option>
                      <option value="brick">кирпич</option>
                      <option value="creature">картошка</option>
                      <option value="flyer">летающий</option>
                      <option value="star">звезда</option>
                    </select>
                  </div>

                  {evt.type === "ground" && (
                    <>
                      <div className="event-cell">
                        <span className="event-label">kind</span>
                        <select value={evt.kind} onChange={(e) => updateEvent(idx, { ...evt, kind: e.target.value as any })}>
                          <option value="pipe">труба</option>
                          <option value="flower">ромашка</option>
                        </select>
                      </div>
                      <div className="event-cell">
                        <span className="event-label">h</span>
                        <input
                          value={evt.height ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, height: e.target.value ? clampInt(e.target.value, 60) : undefined })
                          }
                        />
                      </div>
                      <div className="event-cell">
                        <span className="event-label">w</span>
                        <input
                          value={evt.width ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, width: e.target.value ? clampInt(e.target.value, 30) : undefined })
                          }
                        />
                      </div>
                    </>
                  )}

                  {evt.type === "brick" && (
                    <>
                      <div className="event-cell">
                        <span className="event-label">y</span>
                        <input
                          value={evt.y ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, y: e.target.value ? clampInt(e.target.value, 260) : undefined })
                          }
                        />
                      </div>
                      <div className="event-cell">
                        <span className="event-label">w</span>
                        <input
                          value={evt.width ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, width: e.target.value ? clampInt(e.target.value, 70) : undefined })
                          }
                        />
                      </div>
                      <div className="event-cell">
                        <span className="event-label">h</span>
                        <input
                          value={evt.height ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, height: e.target.value ? clampInt(e.target.value, 22) : undefined })
                          }
                        />
                      </div>
                    </>
                  )}

                  {evt.type === "flyer" && (
                    <>
                      <div className="event-cell">
                        <span className="event-label">kind</span>
                        <select value={evt.kind ?? "bee"} onChange={(e) => updateEvent(idx, { ...evt, kind: e.target.value as any })}>
                          <option value="bee">пчела</option>
                          <option value="fly">муха</option>
                        </select>
                      </div>
                      <div className="event-cell">
                        <span className="event-label">низко</span>
                        <select
                          value={evt.lowFlight === undefined ? "auto" : evt.lowFlight ? "yes" : "no"}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateEvent(idx, { ...evt, lowFlight: v === "auto" ? undefined : v === "yes" });
                          }}
                        >
                          <option value="auto">авто</option>
                          <option value="yes">да</option>
                          <option value="no">нет</option>
                        </select>
                      </div>
                      <div className="event-cell">
                        <span className="event-label">звезда</span>
                        <select
                          value={evt.starCarrier === undefined ? "auto" : evt.starCarrier ? "yes" : "no"}
                          onChange={(e) => {
                            const v = e.target.value;
                            updateEvent(idx, { ...evt, starCarrier: v === "auto" ? undefined : v === "yes" });
                          }}
                        >
                          <option value="auto">авто</option>
                          <option value="yes">да</option>
                          <option value="no">нет</option>
                        </select>
                      </div>
                    </>
                  )}

                  {evt.type === "star" && (
                    <>
                      <div className="event-cell">
                        <span className="event-label">kind</span>
                        <select value={evt.kind} onChange={(e) => updateEvent(idx, { ...evt, kind: e.target.value as any })}>
                          <option value="invincible">неуязвимость</option>
                          <option value="superJump">супер-прыжок</option>
                        </select>
                      </div>
                      <div className="event-cell">
                        <span className="event-label">y</span>
                        <input
                          value={evt.y ?? ""}
                          placeholder="авто"
                          inputMode="numeric"
                          onChange={(e) =>
                            updateEvent(idx, { ...evt, y: e.target.value ? clampInt(e.target.value, 220) : undefined })
                          }
                        />
                      </div>
                    </>
                  )}

                  <div className="event-cell">
                    <button onClick={() => removeEvent(idx)}>{t("levelBuilder.remove")}</button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

