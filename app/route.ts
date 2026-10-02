import { render } from "./lib/html";
import { homeBody } from "./lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/", homeBody()); }
