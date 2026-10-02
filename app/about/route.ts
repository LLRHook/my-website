import { render } from "../lib/html";
import { aboutBody } from "../lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/about", aboutBody()); }
