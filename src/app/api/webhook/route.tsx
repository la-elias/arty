
import { ComfyDeploy } from "comfydeploy";
import { NextResponse } from "next/server";

const cd = new ComfyDeploy();

export async function POST(request: Request) {
  const data = await cd.validateWebhook({ request });

  const { status, runId, outputs, liveStatus, progress } = data;

  // Do your things
  console.log(status, runId, outputs, liveStatus, progress);

  // Return success to ComfyDeploy
  return NextResponse.json({ message: "success" }, { status: 200 });
}
