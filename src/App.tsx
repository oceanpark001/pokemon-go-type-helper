import { useEffect, useMemo, useState } from 'react';
import { TYPE_COLORS, TYPE_ICON_PATHS, TYPE_LABELS } from './data/typeMeta';
import { recommendSwitch } from './lib/battle';
import { loadTeams, saveTeams } from './lib/storage';
import { TYPE_NAMES, type PokemonSlot, type SavedTeam, type SlotAnalysis, type TypeName } from './types';

function uid() {
  return crypto.randomUUID();
}

function emptySlot(index: number): PokemonSlot {
  return {
    id: uid(),
    nickname: `내 포켓몬 ${index + 1}`,
    types: [],
    fastMove: null,
    chargedMoves: [],
  };
}

function defaultTeam(): SavedTeam {
  const now = new Date().toISOString();
  return {
    id: uid(),
    name: '기본 팀',
    createdAt: now,
    updatedAt: now,
    slots: [emptySlot(0), emptySlot(1), emptySlot(2)],
  };
}

function labelClass(label: '굉장' | '보통' | '별로') {
  if (label === '굉장') return 'bg-blue-500/20 text-blue-200 border-blue-400/40';
  if (label === '별로') return 'bg-orange-500/20 text-orange-200 border-orange-400/40';
  return 'bg-white/10 text-slate-100 border-white/10';
}

function compactLabelClass(label: '굉장' | '보통' | '별로') {
  if (label === '굉장') return 'bg-blue-500/15 text-blue-200';
  if (label === '별로') return 'bg-orange-500/15 text-orange-200';
  return 'bg-white/10 text-slate-100';
}

function pickType(list: TypeName[], index: number, next: string): TypeName[] {
  const copy = [...list];
  if (!next) {
    copy.splice(index, 1);
  } else {
    copy[index] = next as TypeName;
  }
  const cleaned = copy.filter(Boolean) as TypeName[];
  return cleaned.filter((type, idx) => cleaned.indexOf(type) === idx).slice(0, 2);
}

function pickChargedMove(list: TypeName[], index: number, next: string): TypeName[] {
  const copy = [...list];
  if (!next) {
    copy.splice(index, 1);
  } else {
    copy[index] = next as TypeName;
  }
  const cleaned = copy.filter(Boolean) as TypeName[];
  return cleaned.filter((type, idx) => cleaned.indexOf(type) === idx).slice(0, 2);
}

function TypeIcon({ type, size = 'md' }: { type: TypeName; size?: 'sm' | 'md' }) {
  const [missing, setMissing] = useState(false);
  const dimension = size === 'sm' ? 'h-6 w-6' : 'h-8 w-8';
  const inner = size === 'sm' ? 'h-4 w-4' : 'h-5 w-5';
  return (
    <span className={`flex ${dimension} items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${TYPE_COLORS[type]}`}>
      {!missing ? (
        <img src={TYPE_ICON_PATHS[type]} alt={TYPE_LABELS[type]} className={`${inner} object-contain`} onError={() => setMissing(true)} />
      ) : (
        <span className="text-[10px] font-bold text-slate-950">{TYPE_LABELS[type].slice(0, 1)}</span>
      )}
    </span>
  );
}

function SmallTypeBadge({ type }: { type: TypeName }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br ${TYPE_COLORS[type]} px-2 py-1 text-xs font-semibold text-slate-950`}>
      <TypeIcon type={type} size="sm" />
      <span>{TYPE_LABELS[type]}</span>
    </span>
  );
}

function TypeSelect({
  value,
  onChange,
  label,
}: {
  value: TypeName | '';
  onChange: (value: string) => void;
  label: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-slate-400">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
      >
        <option value="">없음</option>
        {TYPE_NAMES.map((type) => (
          <option key={type} value={type}>
            {TYPE_LABELS[type]}
          </option>
        ))}
      </select>
    </label>
  );
}

function OpponentTypeButton({ type, selected, onClick }: { type: TypeName; selected: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex min-h-12 items-center justify-center gap-2 rounded-2xl border px-2 py-2 text-sm transition ${
        selected ? 'border-cyan-300 bg-cyan-400/10 shadow-lg shadow-cyan-900/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
      title={TYPE_LABELS[type]}
    >
      <TypeIcon type={type} />
      <span className="hidden text-xs sm:inline">{TYPE_LABELS[type]}</span>
    </button>
  );
}

function SlotEditorCard({
  slot,
  index,
  selected,
  recommended,
  analysis,
  onSelect,
  onChange,
}: {
  slot: PokemonSlot;
  index: number;
  selected: boolean;
  recommended: boolean;
  analysis?: SlotAnalysis;
  onSelect: () => void;
  onChange: (updater: (slot: PokemonSlot) => PokemonSlot) => void;
}) {
  return (
    <div className={`rounded-3xl border p-4 ${selected ? 'border-cyan-300 bg-slate-900/80' : 'border-white/10 bg-black/20'}`}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onSelect} className="text-left">
          <div className="text-xs text-slate-400">포켓몬 {index + 1}</div>
          <div className="mt-1 text-lg font-semibold">{slot.nickname || `내 포켓몬 ${index + 1}`}</div>
        </button>
        <div className="flex flex-col items-end gap-2">
          {selected ? <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-xs text-cyan-200">현재 출전</span> : null}
          {recommended && !selected ? <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">추천 교체</span> : null}
          {analysis ? <span className={`rounded-full border px-2 py-1 text-xs ${labelClass(analysis.overallLabel)}`}>{analysis.overallLabel}</span> : null}
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <label className="block">
          <span className="mb-1 block text-xs text-slate-400">이름</span>
          <input
            value={slot.nickname}
            onChange={(event) => onChange((current) => ({ ...current, nickname: event.target.value }))}
            className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white outline-none"
            placeholder={`내 포켓몬 ${index + 1}`}
          />
        </label>

        <div className="grid grid-cols-2 gap-2">
          <TypeSelect value={slot.types[0] ?? ''} onChange={(value) => onChange((current) => ({ ...current, types: pickType(current.types, 0, value) }))} label="타입 1" />
          <TypeSelect value={slot.types[1] ?? ''} onChange={(value) => onChange((current) => ({ ...current, types: pickType(current.types, 1, value) }))} label="타입 2" />
        </div>

        <TypeSelect
          value={slot.fastMove ?? ''}
          onChange={(value) => onChange((current) => ({ ...current, fastMove: value ? (value as TypeName) : null }))}
          label="일반 공격"
        />

        <div className="grid grid-cols-2 gap-2">
          <TypeSelect
            value={slot.chargedMoves[0] ?? ''}
            onChange={(value) => onChange((current) => ({ ...current, chargedMoves: pickChargedMove(current.chargedMoves, 0, value) }))}
            label="스페셜 1"
          />
          <TypeSelect
            value={slot.chargedMoves[1] ?? ''}
            onChange={(value) => onChange((current) => ({ ...current, chargedMoves: pickChargedMove(current.chargedMoves, 1, value) }))}
            label="스페셜 2"
          />
        </div>
      </div>
    </div>
  );
}

function BattleResultCard({
  slot,
  index,
  analysis,
  selected,
  recommended,
  onSelect,
}: {
  slot: PokemonSlot;
  index: number;
  analysis?: SlotAnalysis;
  selected: boolean;
  recommended: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full rounded-2xl border p-4 text-left transition ${selected ? 'border-cyan-300 bg-slate-900/80' : 'border-white/10 bg-black/20 hover:bg-white/10'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs text-slate-400">포켓몬 {index + 1}</div>
          <div className="mt-1 font-semibold">{slot.nickname || `내 포켓몬 ${index + 1}`}</div>
          <div className="mt-2 flex flex-wrap gap-1">
            {slot.types.length > 0 ? slot.types.map((type) => <SmallTypeBadge key={`${slot.id}-${type}`} type={type} />) : <span className="text-xs text-slate-500">타입 미선택</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          {selected ? <span className="rounded-full bg-cyan-400/20 px-2 py-1 text-xs text-cyan-200">현재 출전</span> : null}
          {recommended && !selected ? <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">추천 교체</span> : null}
        </div>
      </div>

      {analysis ? (
        <>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
            <div className={`rounded-xl px-2 py-2 ${compactLabelClass(analysis.offenseLabel)}`}>
              <div className="text-[11px] text-slate-300">공격</div>
              <div className="mt-1 font-semibold">{analysis.offenseLabel}</div>
            </div>
            <div className={`rounded-xl px-2 py-2 ${compactLabelClass(analysis.defenseLabel)}`}>
              <div className="text-[11px] text-slate-300">방어</div>
              <div className="mt-1 font-semibold">{analysis.defenseLabel}</div>
            </div>
            <div className={`rounded-xl px-2 py-2 ${compactLabelClass(analysis.overallLabel)}`}>
              <div className="text-[11px] text-slate-300">종합</div>
              <div className="mt-1 font-semibold">{analysis.overallLabel}</div>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs text-slate-300">
            <div className="rounded-xl bg-white/5 px-2 py-2">
              <div>최고 공격</div>
              <div className="mt-1 font-semibold text-white">{analysis.attackBest.toFixed(2)}x</div>
            </div>
            <div className="rounded-xl bg-white/5 px-2 py-2">
              <div>평균 공격</div>
              <div className="mt-1 font-semibold text-white">{analysis.attackAverage.toFixed(2)}x</div>
            </div>
            <div className="rounded-xl bg-white/5 px-2 py-2">
              <div>받는 위험</div>
              <div className="mt-1 font-semibold text-white">{analysis.incomingRisk.toFixed(2)}x</div>
            </div>
          </div>
        </>
      ) : (
        <div className="mt-3 text-sm text-slate-500">상대 타입을 선택하면 결과가 표시됩니다.</div>
      )}
    </button>
  );
}

export default function App() {
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activeSlotId, setActiveSlotId] = useState<string>('');
  const [opponentTypes, setOpponentTypes] = useState<TypeName[]>([]);
  const [battleMode, setBattleMode] = useState(false);

  useEffect(() => {
    const loaded = loadTeams();
    if (loaded.length > 0) {
      setTeams(loaded);
      setSelectedTeamId(loaded[0].id);
      setActiveSlotId(loaded[0].slots[0]?.id ?? '');
      return;
    }
    const initial = defaultTeam();
    setTeams([initial]);
    setSelectedTeamId(initial.id);
    setActiveSlotId(initial.slots[0].id);
  }, []);

  useEffect(() => {
    if (teams.length > 0) saveTeams(teams);
  }, [teams]);

  const selectedTeam = useMemo(
    () => teams.find((team) => team.id === selectedTeamId) ?? teams[0] ?? null,
    [teams, selectedTeamId],
  );

  useEffect(() => {
    if (!selectedTeam) return;
    if (!selectedTeam.slots.some((slot) => slot.id === activeSlotId)) {
      setActiveSlotId(selectedTeam.slots[0]?.id ?? '');
    }
  }, [selectedTeam, activeSlotId]);

  const analysisSorted = useMemo(() => {
    if (!selectedTeam || opponentTypes.length === 0) return [];
    return recommendSwitch(selectedTeam.slots, opponentTypes);
  }, [selectedTeam, opponentTypes]);

  const analysisBySlotId = useMemo(() => {
    return Object.fromEntries(analysisSorted.map((item) => [item.slotId, item])) as Record<string, SlotAnalysis>;
  }, [analysisSorted]);

  const recommendedSlotId = analysisSorted[0]?.slotId;

  function updateSelectedTeam(mutator: (team: SavedTeam) => SavedTeam) {
    setTeams((current) => current.map((team) => (team.id === selectedTeamId ? mutator(team) : team)));
  }

  function updateSlot(slotId: string, updater: (slot: PokemonSlot) => PokemonSlot) {
    updateSelectedTeam((team) => ({
      ...team,
      updatedAt: new Date().toISOString(),
      slots: team.slots.map((slot) => (slot.id === slotId ? updater(slot) : slot)),
    }));
  }

  function createTeam() {
    const teamName = window.prompt('새 팀 이름을 입력하세요.', `팀 ${teams.length + 1}`)?.trim();
    if (!teamName) return;
    const team: SavedTeam = { ...defaultTeam(), name: teamName };
    setTeams((current) => [team, ...current]);
    setSelectedTeamId(team.id);
    setActiveSlotId(team.slots[0].id);
  }

  function renameTeam(teamId: string) {
    const current = teams.find((team) => team.id === teamId);
    if (!current) return;
    const nextName = window.prompt('팀 이름을 수정하세요.', current.name)?.trim();
    if (!nextName) return;
    setTeams((list) => list.map((team) => (team.id === teamId ? { ...team, name: nextName, updatedAt: new Date().toISOString() } : team)));
  }

  function deleteTeam(teamId: string) {
    const target = teams.find((team) => team.id === teamId);
    if (!target) return;
    if (!window.confirm(`'${target.name}' 팀을 삭제할까요?`)) return;
    const remaining = teams.filter((team) => team.id !== teamId);
    if (remaining.length === 0) {
      const team = defaultTeam();
      setTeams([team]);
      setSelectedTeamId(team.id);
      setActiveSlotId(team.slots[0].id);
      return;
    }
    setTeams(remaining);
    setSelectedTeamId(remaining[0].id);
    setActiveSlotId(remaining[0].slots[0].id);
  }

  const activeSlot = selectedTeam?.slots.find((slot) => slot.id === activeSlotId) ?? selectedTeam?.slots[0] ?? null;
  const activeAnalysis = activeSlot ? analysisBySlotId[activeSlot.id] : undefined;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-4 md:px-6 md:py-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-4 shadow-2xl shadow-cyan-900/10 md:p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-300 md:text-sm">PoGO Battle Helper</p>
              <h1 className="mt-2 text-2xl font-bold md:text-4xl">내 3마리 팀 기반 상성 추천 MVP</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-300 md:text-base">
                상대 타입을 최대 2개 선택하면 현재 포켓몬의 유불리를 보여주고, 내 팀 3마리 중 어떤 포켓몬으로 교체하는 것이 좋은지 추천합니다.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={createTeam} className="rounded-full bg-cyan-400 px-4 py-2 font-semibold text-slate-950">
                새 팀 저장
              </button>
              {selectedTeam ? (
                <>
                  <button type="button" onClick={() => renameTeam(selectedTeam.id)} className="rounded-full border border-white/15 px-4 py-2 font-semibold">
                    팀 이름 수정
                  </button>
                  <button type="button" onClick={() => deleteTeam(selectedTeam.id)} className="rounded-full border border-rose-400/30 px-4 py-2 font-semibold text-rose-200">
                    팀 삭제
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={() => setBattleMode((value) => !value)}
                className={`rounded-full px-4 py-2 font-semibold ${battleMode ? 'bg-emerald-400 text-slate-950' : 'border border-white/15 text-white'}`}
              >
                배틀 모드 {battleMode ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        </header>

        <section className="grid gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
          {!battleMode ? (
            <aside className="rounded-3xl border border-white/10 bg-white/5 p-4">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">저장된 팀</h2>
                <span className="text-sm text-slate-400">{teams.length}개</span>
              </div>
              <div className="space-y-3">
                {teams.map((team) => (
                  <button
                    key={team.id}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(team.id);
                      setActiveSlotId(team.slots[0]?.id ?? '');
                    }}
                    className={`w-full rounded-2xl border p-4 text-left transition ${
                      selectedTeamId === team.id ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-black/20 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <strong>{team.name}</strong>
                      <span className="text-xs text-slate-400">{new Date(team.updatedAt).toLocaleDateString('ko-KR')}</span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {team.slots.map((slot) => (
                        <span key={slot.id} className="rounded-full bg-white/10 px-2 py-1 text-xs text-slate-300">
                          {slot.nickname}
                        </span>
                      ))}
                    </div>
                  </button>
                ))}
              </div>
            </aside>
          ) : null}

          <main className="space-y-4">
            {!battleMode ? (
              <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">1. 내 팀 편집</h2>
                    <p className="text-sm text-slate-400">포켓몬 1/2/3 카드 안에서 이름, 타입, 기술을 드롭다운으로 바로 수정합니다.</p>
                  </div>
                  {selectedTeam ? <span className="rounded-full bg-white/10 px-3 py-1 text-sm">현재 팀: {selectedTeam.name}</span> : null}
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  {selectedTeam?.slots.map((slot, index) => (
                    <SlotEditorCard
                      key={slot.id}
                      slot={slot}
                      index={index}
                      selected={activeSlotId === slot.id}
                      recommended={recommendedSlotId === slot.id}
                      analysis={analysisBySlotId[slot.id]}
                      onSelect={() => setActiveSlotId(slot.id)}
                      onChange={(updater) => updateSlot(slot.id, updater)}
                    />
                  ))}
                </div>
              </section>
            ) : null}

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">{battleMode ? '배틀 모드' : '2. 배틀 보기'}</h2>
                  <p className="text-sm text-slate-400">안드로이드 화면에서도 상대 타입 선택과 결과를 한 번에 보이도록 압축했습니다.</p>
                </div>
                {selectedTeam ? <span className="rounded-full bg-white/10 px-3 py-1 text-sm">현재 팀: {selectedTeam.name}</span> : null}
              </div>

              <div className="space-y-4">
                <div className="sticky top-0 z-10 -mx-1 rounded-2xl border border-white/10 bg-slate-950/90 p-3 backdrop-blur">
                  <div className="mb-2 text-xs text-slate-400">현재 출전 포켓몬 선택</div>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedTeam?.slots.map((slot, index) => {
                      const selected = activeSlotId === slot.id;
                      const recommended = recommendedSlotId === slot.id;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setActiveSlotId(slot.id)}
                          className={`rounded-2xl border px-2 py-3 text-left text-sm transition ${
                            selected ? 'border-cyan-300 bg-cyan-400/10' : 'border-white/10 bg-black/20 hover:bg-white/10'
                          }`}
                        >
                          <div className="text-[11px] text-slate-400">포켓몬 {index + 1}</div>
                          <div className="mt-1 truncate font-semibold">{slot.nickname}</div>
                          <div className="mt-2 flex flex-wrap gap-1">
                            {slot.types.slice(0, 2).map((type) => (
                              <TypeIcon key={`${slot.id}-pick-${type}`} type={type} size="sm" />
                            ))}
                          </div>
                          {!selected && recommended ? <div className="mt-2 text-[11px] text-emerald-200">추천 교체</div> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">상대 타입 선택</div>
                      <div className="text-xs text-slate-400">최대 2개까지 선택</div>
                    </div>
                    {opponentTypes.length > 0 ? (
                      <button type="button" onClick={() => setOpponentTypes([])} className="rounded-full border border-white/15 px-3 py-1 text-xs">
                        초기화
                      </button>
                    ) : null}
                  </div>
                  <div className="grid grid-cols-6 gap-2 sm:grid-cols-6 md:grid-cols-6 xl:grid-cols-9">
                    {TYPE_NAMES.map((type) => (
                      <OpponentTypeButton
                        key={`opponent-${type}`}
                        type={type}
                        selected={opponentTypes.includes(type)}
                        onClick={() =>
                          setOpponentTypes((current) => {
                            if (current.includes(type)) return current.filter((item) => item !== type);
                            if (current.length >= 2) return [current[1], type];
                            return [...current, type];
                          })
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="text-xs text-slate-400">현재 상대:</span>
                    {opponentTypes.length > 0 ? opponentTypes.map((type) => <SmallTypeBadge key={`selected-${type}`} type={type} />) : <span className="text-xs text-slate-500">미선택</span>}
                  </div>
                </div>

                {battleMode && activeSlot ? (
                  <div className="rounded-2xl border border-cyan-400/20 bg-cyan-400/5 p-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs text-cyan-200">현재 출전 포켓몬</div>
                        <div className="mt-1 text-lg font-semibold">{activeSlot.nickname}</div>
                      </div>
                      {activeAnalysis ? <span className={`rounded-full border px-3 py-1 text-sm ${labelClass(activeAnalysis.overallLabel)}`}>종합 {activeAnalysis.overallLabel}</span> : null}
                    </div>
                    {activeAnalysis ? (
                      <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs sm:text-sm">
                        <div className={`rounded-xl px-2 py-2 ${compactLabelClass(activeAnalysis.offenseLabel)}`}>
                          <div className="text-[11px] text-slate-300">공격</div>
                          <div className="mt-1 font-semibold">{activeAnalysis.offenseLabel}</div>
                        </div>
                        <div className={`rounded-xl px-2 py-2 ${compactLabelClass(activeAnalysis.defenseLabel)}`}>
                          <div className="text-[11px] text-slate-300">방어</div>
                          <div className="mt-1 font-semibold">{activeAnalysis.defenseLabel}</div>
                        </div>
                        <div className={`rounded-xl px-2 py-2 ${compactLabelClass(activeAnalysis.overallLabel)}`}>
                          <div className="text-[11px] text-slate-300">종합</div>
                          <div className="mt-1 font-semibold">{activeAnalysis.overallLabel}</div>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-slate-400">상대 타입을 선택하면 현재 포켓몬 유불리가 표시됩니다.</div>
                    )}
                  </div>
                ) : null}

                <div className="rounded-2xl bg-black/20 p-3">
                  <div className="mb-3">
                    <h3 className="font-semibold">유/불리 결과</h3>
                    <p className="text-xs text-slate-400">포켓몬 1 / 2 / 3 순서를 그대로 유지하고, 가장 적합한 교체만 배지로 강조합니다.</p>
                  </div>
                  <div className="grid gap-3 lg:grid-cols-3">
                    {selectedTeam?.slots.map((slot, index) => (
                      <BattleResultCard
                        key={`battle-result-${slot.id}`}
                        slot={slot}
                        index={index}
                        analysis={analysisBySlotId[slot.id]}
                        selected={slot.id === activeSlotId}
                        recommended={slot.id === recommendedSlotId}
                        onSelect={() => setActiveSlotId(slot.id)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          </main>
        </section>
      </div>
    </div>
  );
}
