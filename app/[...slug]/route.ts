import { SITE_DESCRIPTION } from "../lib/constants";
import { htmlResponse, page } from "../lib/html";
import { notFoundBody } from "../lib/pages";

export function GET() {
  return htmlResponse(page({ path: "", title: "Page not found | Victor Ivanov", description: SITE_DESCRIPTION, body: notFoundBody() }), 404);
}
