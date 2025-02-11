import {NextResponse} from "next/server";
import {ComfyDeploy} from "comfydeploy";

export const POST = async (request:Request)=>{
  try {
    const {input_image_style,input_image} = await request.json();
    if(!input_image_style || !input_image){
      return NextResponse.json({error:"Missing required inputs."},{status:400});
    }

    const cd = new ComfyDeploy({bearer:process.env.COMFY_DEPLOY_API_KEY!});

    const result = await cd.run.deployment.queue({
      deploymentId:"a7eb6daa-dd7c-4179-9c2b-09bbb505772d",
      webhook:process.env.COMFY_DEPLOY_WEBHOOK_URL || "https://your-domain.com/api/webhook",
      inputs:{input_image_style,input_image}
    });

    if(result){
      return NextResponse.json({runId:result.runId},{status:200});
    } else {
      return NextResponse.json({error:"Failed to create run."},{status:500});
    }
  } catch(error){
    console.error("Error triggering comfydeploy:",error);
    return NextResponse.json({error:"Internal server error."},{status:500});
  }
};