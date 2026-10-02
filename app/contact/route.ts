import { render } from "../lib/html";
import { contactBody } from "../lib/pages";

export const dynamic = "force-static";
export function GET() { return render("/contact", contactBody()); }
