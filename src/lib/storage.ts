import type { SavedTeam } from '../types';

const STORAGE_KEY = 'pogo-type-helper-teams-v1';

export function loadTeams(): SavedTeam[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedTeam[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTeams(teams: SavedTeam[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(teams));
}
