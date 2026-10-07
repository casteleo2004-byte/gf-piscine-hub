import { newId } from "../id";
import type {
  DiaryEntry,
  GearItem,
  Place,
  RallyStage,
  Settings,
  SpectatorPoint,
  TripDay,
  TripEvent,
} from "../types";
import { update } from "./store";

// Operazioni di modifica usate dalla UI. Ogni azione salva subito.

function upsert<T>(list: T[], item: T, key: (x: T) => string): void {
  const i = list.findIndex((x) => key(x) === key(item));
  if (i >= 0) list[i] = item;
  else list.push(item);
}

const byId = <T extends { id: string }>(x: T) => x.id;

export const actions = {
  toggleEventDone(id: string) {
    update((d) => {
      const e = d.events.find((x) => x.id === id);
      if (e) e.done = !e.done;
    });
  },
  saveEvent(e: TripEvent) {
    update((d) => upsert(d.events, e, byId));
  },
  deleteEvent(id: string) {
    update((d) => {
      d.events = d.events.filter((x) => x.id !== id);
    });
  },
  /** Sceglie la meta di un'attività tra le opzioni: aggiorna luogo e titolo. */
  chooseEventPlace(id: string, placeId: string) {
    update((d) => {
      const e = d.events.find((x) => x.id === id);
      const p = d.places.find((x) => x.id === placeId);
      if (e && p) {
        e.placeId = p.id;
        e.title = p.name;
      }
    });
  },
  resetDay(date: string) {
    update((d) => {
      for (const e of d.events) if (e.date === date) e.done = false;
    });
  },

  /** Aggiunge o toglie una prova dal piano del suo giorno. */
  togglePlan(date: string, stageId: string) {
    update((d) => {
      const day = d.days.find((x) => x.date === date);
      if (!day) return;
      const plan = new Set(day.planStageIds ?? d.stages.filter((s) => s.date === date).map((s) => s.id));
      if (plan.has(stageId)) plan.delete(stageId);
      else plan.add(stageId);
      day.planStageIds = [...plan];
    });
  },

  saveDay(day: TripDay) {
    update((d) => upsert(d.days, day, (x) => x.date));
  },

  saveStage(s: RallyStage) {
    update((d) => upsert(d.stages, s, byId));
  },
  deleteStage(id: string) {
    update((d) => {
      d.stages = d.stages.filter((x) => x.id !== id);
      d.spectatorPoints = d.spectatorPoints.filter((p) => p.stageId !== id);
      for (const e of d.events) if (e.stageId === id) delete e.stageId;
    });
  },
  toggleStageSeen(id: string) {
    update((d) => {
      const s = d.stages.find((x) => x.id === id);
      if (s) s.seen = !s.seen;
    });
  },

  saveSpectatorPoint(p: SpectatorPoint, makePrimary = false) {
    update((d) => {
      upsert(d.spectatorPoints, p, byId);
      const s = d.stages.find((x) => x.id === p.stageId);
      if (s && (makePrimary || !s.spectatorPointId)) s.spectatorPointId = p.id;
    });
  },
  deleteSpectatorPoint(id: string) {
    update((d) => {
      d.spectatorPoints = d.spectatorPoints.filter((x) => x.id !== id);
      for (const s of d.stages) if (s.spectatorPointId === id) delete s.spectatorPointId;
    });
  },

  savePlace(p: Place) {
    update((d) => upsert(d.places, p, byId));
  },
  deletePlace(id: string) {
    update((d) => {
      d.places = d.places.filter((x) => x.id !== id);
      for (const e of d.events) if (e.placeId === id) delete e.placeId;
    });
  },
  togglePlaceVisited(id: string) {
    update((d) => {
      const p = d.places.find((x) => x.id === id);
      if (p) p.visited = !p.visited;
    });
  },

  toggleGear(presetId: string, itemId: string) {
    update((d) => {
      const item = d.gearPresets.find((p) => p.id === presetId)?.items.find((i) => i.id === itemId);
      if (item) item.checked = !item.checked;
    });
  },
  resetGear(presetId: string) {
    update((d) => {
      const p = d.gearPresets.find((x) => x.id === presetId);
      if (p) for (const i of p.items) i.checked = false;
    });
  },
  addGear(presetId: string, name: string) {
    update((d) => {
      const p = d.gearPresets.find((x) => x.id === presetId);
      const item: GearItem = { id: newId("g"), name, checked: false };
      if (p) p.items.push(item);
    });
  },
  renameGear(presetId: string, itemId: string, name: string) {
    update((d) => {
      const item = d.gearPresets.find((p) => p.id === presetId)?.items.find((i) => i.id === itemId);
      if (item) item.name = name;
    });
  },
  removeGear(presetId: string, itemId: string) {
    update((d) => {
      const p = d.gearPresets.find((x) => x.id === presetId);
      if (p) p.items = p.items.filter((i) => i.id !== itemId);
    });
  },

  saveDiary(entry: DiaryEntry) {
    update((d) => upsert(d.diary, entry, (x) => x.date));
  },

  saveSettings(patch: Partial<Settings>) {
    update((d) => {
      d.settings = { ...d.settings, ...patch };
    });
  },
};
