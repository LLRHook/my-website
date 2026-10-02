import { render } from "../lib/html";
import { offTheClockBody } from "../lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/off-the-clock", offTheClockBody()); }
