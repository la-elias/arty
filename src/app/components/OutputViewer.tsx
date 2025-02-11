'use client';
import React, { useEffect, useState } from 'react';
import { Spin, Alert, Progress, Image } from 'antd';

// Updated interfaces based on the full response from the GET endpoint.
interface ImageData {
  url: string;
  type: string;
  filename: string;
  isPublic: boolean;
  subfolder: string;
  uploadDuration: number;
}

interface OutputEntry {
  id: string;
  runId: string;
  data: {
    images?: ImageData[];
    tags?: string[];
  };
  nodeMeta: {
    node_id: string;
    node_class: string;
  };
  createdAt: string;
  updatedAt: string;
  type: string | null;
  nodeId: string | null;
}

interface RunStatus {
  id: string;             // run id from the main response
  status: string;
  liveStatus: string;
  progress: number;       // value between 0 and 1 (e.g., 0.87)
  outputs: OutputEntry[];
}

interface OutputViewerProps {
  runId: string;
}

const contentStyle: React.CSSProperties = {
    padding: 50,
    background: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 4,
  };
  
const content = <div style={contentStyle} />;

export const OutputViewer: React.FC<OutputViewerProps> = ({ runId }) => {
  const [runStatus, setRunStatus] = useState<RunStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!runId) return;
    let interval: NodeJS.Timeout | null = null;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/getRunStatus?runId=${runId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch run status');
        }
        const data: RunStatus = await res.json();
        setRunStatus(data);
        setLoading(false);
        // Stop polling when status is "success"
        if (data.status === 'success') {
          if (interval) clearInterval(interval);
        }
      } catch (err: unknown) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
        setLoading(false);
        if (interval) clearInterval(interval);
      }
    };

    fetchStatus();
    interval = setInterval(fetchStatus, 2000);
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [runId]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full p-8">
        <Spin tip="Loading..." size="small">
            {content}
        </Spin>
      </div>
    );
  }

  if (error) {
    return <Alert message="Error" description={error} type="error" />;
  }

  if (!runStatus) return null;

  // Filter outputs to include only entries from the output image node.
  const imageOutputs = runStatus.outputs.filter(
    (output) =>
      output.nodeMeta.node_class === 'ComfyDeployOutputImage' &&
      output.data.images &&
      output.data.images.length > 0
  );

  return (
    <div className="p-4">
      {/* Render image outputs at the top */}
      {imageOutputs.length > 0 && (
        <div className="grid grid-cols-1 gap-4 mb-4">
          {imageOutputs.map((output, index) => (
            <Image
              key={output.id}
              src={output.data.images![0].url}
              alt={`Output ${index + 1}`}
              className="rounded-md border"
            />
          ))}
        </div>
      )}
      {/* Display current status and progress */}
      <div className="text-center">
        <p>Status: {runStatus.status}</p>
        {runStatus.status !== 'success' && (
          <Progress percent={Math.round(runStatus.progress * 100)} />
        )}
      </div>
      {/* Display the run ID in small gray text */}
      <div className="text-center text-gray-500 text-xs mt-2">
        Run ID: {runStatus.id}
      </div>
    </div>
  );
};
