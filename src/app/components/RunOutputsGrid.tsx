'use client';
import React from 'react';
import { OutputViewer } from './OutputViewer';

interface RunOutputsGridProps {
  runIds: string[];
}

export const RunOutputsGrid: React.FC<RunOutputsGridProps> = ({ runIds }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {runIds.map((runId) => (
        <div key={runId} className="border rounded-md p-4">
          <OutputViewer runId={runId} />
        </div>
      ))}
    </div>
  );
};
