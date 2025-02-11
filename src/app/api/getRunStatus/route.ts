import { ComfyDeploy } from 'comfydeploy';
import { NextResponse } from 'next/server';

const cd = new ComfyDeploy({ bearer: process.env.COMFY_DEPLOY_API_KEY! });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const runId = searchParams.get('runId');
  if (!runId) {
    return NextResponse.json({error:'Missing runId'},{status:400});
  }
  try {
    // Assuming the comfydeploy SDK has a method like cd.run.get() to retrieve run status.
    const runStatus = await cd.run.get({ runId });
    return NextResponse.json(runStatus,{status:200});
  } catch(error) {
    console.error('Error fetching run status:',error);
    return NextResponse.json({error:'Failed to fetch run status'},{status:500});
  }
}
