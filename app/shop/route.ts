import { render } from "../lib/html";
import { shopBody } from "../lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/shop", shopBody()); }
