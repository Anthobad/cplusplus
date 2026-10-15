import React, { useEffect, useState } from 'react';
import type { Unit } from '../types';
import { loadUnit } from '../data/loadCurriculum';
import { getUnitById } from '../data/curriculumSummary';
import { UnitView } from './UnitView';

type Props = Omit<React.ComponentProps<typeof UnitView>, 'unit'> & { unitId: string };

export default function DomainUnitView({ unitId, ...props }: Props) {
  const [unit, setUnit] = useState<Unit>();
  const [failedId, setFailedId] = useState<string>();
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    let active = true;
    setFailedId(undefined);
    loadUnit(unitId).then(unit => {
      if (active) setUnit(unit);
    }).catch(() => {
      if (active) setFailedId(unitId);
    });
    return () => { active = false; };
  }, [unitId, retry]);

  const ready = unit?.id === getUnitById(unitId)?.id;
  return <>
    {unit && <div hidden={!ready} inert={!ready ? true : undefined}><UnitView {...props} unit={unit} /></div>}
    {!ready && <div className="p-8 text-slate-300 space-y-4">
    {failedId === unitId ? <>
      <p role="alert">This lesson could not be loaded. Check your connection and try again. If the problem persists after an update, reload the page.</p>
      <button type="button" className="text-blue-300 underline mr-4" onClick={() => setRetry(value => value + 1)}>Retry lesson</button>
    </> : <p role="status">Loading lesson…</p>}
    <button type="button" className="text-blue-300 underline" onClick={props.onBackToRoadmap}>Curriculum Roadmap</button>
    </div>}
  </>;
}
