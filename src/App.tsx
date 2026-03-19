import { useEffect, useMemo, useState } from 'react';
import { TYPE_COLORS, TYPE_ICON_PATHS, TYPE_LABELS } from './data/typeMeta';
import { recommendSwitch } from './lib/battle';
import { loadTeams, saveTeams } from './lib/storage';
import { TYPE_NAMES, type PokemonSlot, type SavedTeam, type TypeName } from './types';

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

function TypePill({ type, selected, onClick }: { type: TypeName; selected?: boolean; onClick?: () => void }) {
  const [missing, setMissing] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition ${
        selected ? 'border-cyan-300 bg-slate-800 shadow-lg shadow-cyan-500/20' : 'border-white/10 bg-white/5 hover:bg-white/10'
      }`}
    >
      <span className={`flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br ${TYPE_COLORS[type]}`}>
        {!missing ? (
          <img
            src={TYPE_ICON_PATHS[type]}
            alt={TYPE_LABELS[type]}
            className="h-6 w-6 object-contain"
            onError={() => setMissing(true)}
          />
        ) : (
          <span className="text-[10px] font-bold text-slate-950">{TYPE_LABELS[type].slice(0, 1)}</span>
        )}
      </span>
      <span>{TYPE_LABELS[type]}</span>
    </button>
  );
}

function SmallTypeBadge({ type }: { type: TypeName }) {
  const [missing, setMissing] = useState(false);
  return (
    <span className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-br ${TYPE_COLORS[type]} px-2 py-1 text-xs font-semibold text-slate-950`}>
      {!missing ? (
        <img
          src={TYPE_ICON_PATHS[type]}
          alt={TYPE_LABELS[type]}
          className="h-4 w-4 object-contain"
          onError={() => setMissing(true)}
        />
      ) : null}
      <span>{TYPE_LABELS[type]}</span>
    </span>
  );
}

function toggleLimited(list: TypeName[], value: TypeName, limit: number): TypeName[] {
  if (list.includes(value)) return list.filter((item) => item !== value);
  if (list.length >= limit) return [...list.slice(1), value];
  return [...list, value];
}

function labelClass(label: '굉장' | '보통' | '별로') {
  if (label === '굉장') return 'bg-blue-500/20 text-blue-200 border-blue-400/40';
  if (label === '별로') return 'bg-orange-500/20 text-orange-200 border-orange-400/40';
  return 'bg-white/10 text-slate-100 border-white/10';
}

export default function App() {
  const [teams, setTeams] = useState<SavedTeam[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [activeSlotId, setActiveSlotId] = useState<string>('');
  const [opponentTypes, setOpponentTypes] = useState<TypeName[]>([]);

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

  const activeSlot = useMemo(
    () => selectedTeam?.slots.find((slot) => slot.id === activeSlotId) ?? selectedTeam?.slots[0] ?? null,
    [selectedTeam, activeSlotId],
  );

  const analysis = useMemo(() => {
    if (!selectedTeam || opponentTypes.length === 0) return [];
    return recommendSwitch(selectedTeam.slots, opponentTypes);
  }, [selectedTeam, opponentTypes]);

  useEffect(() => {
    if (!selectedTeam) return;
    if (!selectedTeam.slots.some((slot) => slot.id === activeSlotId)) {
      setActiveSlotId(selectedTeam.slots[0]?.id ?? '');
    }
  }, [selectedTeam, activeSlotId]);

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

  const currentSlotAnalysis = analysis.find((item) => item.slotId === activeSlot?.id);
  const recommendedSlotId = analysis[0]?.slotId;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 md:px-6 lg:px-8">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl shadow-cyan-900/10">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">PoGO Battle Helper</p>
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
            </div>
          </div>
        </header>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
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

          <main className="space-y-6">
            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold">1. 내 팀 3마리</h2>
                  <p className="text-sm text-slate-400">상단 카드를 눌러 현재 출전 포켓몬을 선택하세요.</p>
                </div>
                {selectedTeam ? <span className="rounded-full bg-white/10 px-3 py-1 text-sm">현재 팀: {selectedTeam.name}</span> : null}
              </div>

              <div className="grid gap-4 lg:grid-cols-3">
                {selectedTeam?.slots.map((slot, index) => {
                  const slotResult = analysis.find((item) => item.slotId === slot.id);
                  const selected = activeSlot?.id === slot.id;
                  const recommended = recommendedSlotId === slot.id;
                  return (
                    <button
                      key={slot.id}
                      type="button"
                      onClick={() => setActiveSlotId(slot.id)}
                      className={`rounded-3xl border p-4 text-left transition ${
                        selected ? 'border-cyan-300 bg-slate-900/80 shadow-lg shadow-cyan-900/20' : 'border-white/10 bg-black/20 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-xs text-slate-400">포켓몬 {index + 1}</div>
                          <div className="mt-1 text-lg font-semibold">{slot.nickname}</div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {recommended ? <span className="rounded-full bg-emerald-400/20 px-2 py-1 text-xs text-emerald-200">추천 교체</span> : null}
                          {slotResult ? <span className={`rounded-full border px-2 py-1 text-xs ${labelClass(slotResult.overallLabel)}`}>{slotResult.overallLabel}</span> : null}
                        </div>
                      </div>

                      <div className="mt-4 space-y-3 text-sm">
                        <div>
                          <div className="mb-1 text-slate-400">타입</div>
                          <div className="flex flex-wrap gap-2">{slot.types.map((type) => <SmallTypeBadge key={type} type={type} />)}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-slate-400">일반 공격</div>
                          <div>{slot.fastMove ? <SmallTypeBadge type={slot.fastMove} /> : <span className="text-slate-500">미선택</span>}</div>
                        </div>
                        <div>
                          <div className="mb-1 text-slate-400">스페셜 공격</div>
                          <div className="flex flex-wrap gap-2">
                            {slot.chargedMoves.length > 0 ? slot.chargedMoves.map((type) => <SmallTypeBadge key={type} type={type} />) : <span className="text-slate-500">미선택</span>}
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">2. 현재 출전 포켓몬 편집</h2>
                <p className="text-sm text-slate-400">타입은 최대 2개, 스페셜 공격도 최대 2개까지 선택됩니다.</p>
              </div>
              {activeSlot ? (
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm text-slate-400">포켓몬 이름</span>
                    <input
                      value={activeSlot.nickname}
                      onChange={(event) => updateSlot(activeSlot.id, (slot) => ({ ...slot, nickname: event.target.value }))}
                      className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-white outline-none ring-0 placeholder:text-slate-500"
                      placeholder="예: 질뻐기"
                    />
                  </label>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">포켓몬 타입</div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {TYPE_NAMES.map((type) => (
                        <TypePill
                          key={`slot-type-${type}`}
                          type={type}
                          selected={activeSlot.types.includes(type)}
                          onClick={() => updateSlot(activeSlot.id, (slot) => ({ ...slot, types: toggleLimited(slot.types, type, 2) }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">일반 공격 타입</div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {TYPE_NAMES.map((type) => (
                        <TypePill
                          key={`fast-${type}`}
                          type={type}
                          selected={activeSlot.fastMove === type}
                          onClick={() => updateSlot(activeSlot.id, (slot) => ({ ...slot, fastMove: slot.fastMove === type ? null : type }))}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-sm text-slate-400">스페셜 공격 타입 (최대 2개)</div>
                    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                      {TYPE_NAMES.map((type) => (
                        <TypePill
                          key={`charged-${type}`}
                          type={type}
                          selected={activeSlot.chargedMoves.includes(type)}
                          onClick={() =>
                            updateSlot(activeSlot.id, (slot) => ({ ...slot, chargedMoves: toggleLimited(slot.chargedMoves, type, 2) }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400">선택된 포켓몬이 없습니다.</div>
              )}
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">3. 상대 타입 선택</h2>
                <p className="text-sm text-slate-400">상대 포켓몬의 타입을 최대 2개까지 선택하세요. 모바일에서는 3줄, 넓은 화면에서는 2줄 이상으로 자동 배치됩니다.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                {TYPE_NAMES.map((type) => (
                  <TypePill
                    key={`opponent-${type}`}
                    type={type}
                    selected={opponentTypes.includes(type)}
                    onClick={() => setOpponentTypes((current) => toggleLimited(current, type, 2))}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-sm text-slate-400">현재 상대 타입:</span>
                {opponentTypes.length ? opponentTypes.map((type) => <SmallTypeBadge key={type} type={type} />) : <span className="text-sm text-slate-500">미선택</span>}
                {opponentTypes.length ? (
                  <button type="button" onClick={() => setOpponentTypes([])} className="ml-auto rounded-full border border-white/15 px-3 py-1 text-sm">
                    상대 선택 초기화
                  </button>
                ) : null}
              </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-5">
              <div className="mb-4">
                <h2 className="text-lg font-semibold">4. 유/불리 결과 + 교체 추천</h2>
                <p className="text-sm text-slate-400">굉장(1.25), 보통(1.0), 별로(0.8) 기준과 자속보정(STAB 1.25), 이중 약점/반감을 반영합니다.</p>
              </div>

              {opponentTypes.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 p-6 text-center text-slate-400">상대 타입을 먼저 선택하세요.</div>
              ) : (
                <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
                  <div className="space-y-3">
                    {analysis.map((item, index) => {
                      const slot = selectedTeam?.slots.find((value) => value.id === item.slotId);
                      if (!slot) return null;
                      return (
                        <div key={item.slotId} className="rounded-2xl border border-white/10 bg-black/20 p-4">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <div className="text-xs text-slate-400">추천 순위 {index + 1}</div>
                              <div className="mt-1 text-lg font-semibold">{slot.nickname}</div>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className={`rounded-full border px-3 py-1 text-sm ${labelClass(item.overallLabel)}`}>종합 {item.overallLabel}</span>
                              <span className={`rounded-full border px-3 py-1 text-sm ${labelClass(item.offenseLabel)}`}>공격 {item.offenseLabel}</span>
                              <span className={`rounded-full border px-3 py-1 text-sm ${labelClass(item.defenseLabel)}`}>방어 {item.defenseLabel}</span>
                            </div>
                          </div>
                          <div className="mt-3 grid gap-3 text-sm md:grid-cols-3">
                            <div className="rounded-2xl bg-white/5 p-3">
                              <div className="text-slate-400">최고 공격 배율</div>
                              <div className="mt-1 text-xl font-bold">{item.attackBest.toFixed(2)}x</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-3">
                              <div className="text-slate-400">평균 공격 배율</div>
                              <div className="mt-1 text-xl font-bold">{item.attackAverage.toFixed(2)}x</div>
                            </div>
                            <div className="rounded-2xl bg-white/5 p-3">
                              <div className="text-slate-400">받는 위험도</div>
                              <div className="mt-1 text-xl font-bold">{item.incomingRisk.toFixed(2)}x</div>
                            </div>
                          </div>
                          <ul className="mt-3 space-y-2 text-sm text-slate-300">
                            {item.reasons.map((reason) => (
                              <li key={reason} className="rounded-xl bg-white/5 px-3 py-2">
                                {reason}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rounded-3xl border border-cyan-400/20 bg-cyan-400/5 p-4">
                    <h3 className="text-lg font-semibold">현재 출전 포켓몬 요약</h3>
                    {activeSlot ? (
                      <>
                        <div className="mt-3 text-2xl font-bold">{activeSlot.nickname}</div>
                        <div className="mt-2 flex flex-wrap gap-2">{activeSlot.types.map((type) => <SmallTypeBadge key={type} type={type} />)}</div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                          <div className={`rounded-2xl border p-3 ${currentSlotAnalysis ? labelClass(currentSlotAnalysis.offenseLabel) : 'border-white/10 bg-white/5'}`}>
                            공격 판단: {currentSlotAnalysis?.offenseLabel ?? '-'}
                          </div>
                          <div className={`rounded-2xl border p-3 ${currentSlotAnalysis ? labelClass(currentSlotAnalysis.defenseLabel) : 'border-white/10 bg-white/5'}`}>
                            방어 판단: {currentSlotAnalysis?.defenseLabel ?? '-'}
                          </div>
                          <div className={`rounded-2xl border p-3 ${currentSlotAnalysis ? labelClass(currentSlotAnalysis.overallLabel) : 'border-white/10 bg-white/5'}`}>
                            종합 판단: {currentSlotAnalysis?.overallLabel ?? '-'}
                          </div>
                        </div>
                        <div className="mt-4 rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-300">
                          {recommendedSlotId === activeSlot.id
                            ? '현재 출전 포켓몬이 가장 추천됩니다.'
                            : '현재 포켓몬보다 더 유리한 포켓몬이 있습니다. 상단 추천 순위 1번으로 교체를 고려하세요.'}
                        </div>
                      </>
                    ) : (
                      <div className="mt-3 text-slate-400">현재 출전 포켓몬을 선택하세요.</div>
                    )}
                  </div>
                </div>
              )}
            </section>
          </main>
        </section>
      </div>
    </div>
  );
}
