import { render } from "../lib/html";
import { resumeBody } from "../lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/resume", resumeBody()); }
