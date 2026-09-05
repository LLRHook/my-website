# Resume suggestions

Reviewed September 5, 2026. These are proposed changes for Victor to review. The source PDFs have not been edited. The website can reformat the supported experience into readable HTML without changing the underlying claims.

## Sources and version choice

The most recent candidate is `Victor_Ivanov_FSR.pdf`, a one-page resume in the local Downloads folder, last modified August 12, 2026. It adds recent React/Next.js work and a July-August 2026 Revature practicum. Its role dates agree with both June versions. Use it as the working source for the website; the file modification date establishes which local copy is newer, not when every claim was last verified.

| Source | Relevant differences |
| --- | --- |
| `Victor_Ivanov_FSR.pdf`, page 1 | Current full-stack emphasis; Paradigm Testing experience; Revature practicum; MailIt, Citybase, and Fix YouTube projects. |
| `VI resume.pdf`, page 1, last modified June 23, 2026 | Backend emphasis; older project selection and test counts; revised video/auth bullets; no UMBC graduation year. |
| `Victor_Ivanov_Resume.pdf`, page 1, last modified June 4, 2026 | Similar to the June 23 version; explicitly lists UMBC graduation in 2022. |
| Existing website, `app/components/AboutSection.tsx` before this makeover | Describes a lead full-stack role and an AI master's, which differ from the resume wording. |

The other filename candidate, `8-2023-Resume.pdf`, belongs to someone else and is excluded from this review. Do not use its content for Victor's website or resume.

The resume files support the facts below. Employment outcomes and metrics were not independently checked against employer records.

## Facts for the virtual computer

| Item | Supported wording | Source |
| --- | --- | --- |
| Current role | Senior Backend Engineer, Paradigm Testing; May 2024-present | All three Victor resume PDFs, Experience |
| Earlier role | Software Developer, Paradigm Testing; June 2022-May 2024 | All three Victor resume PDFs, Experience |
| Recent practicum | Full-Stack Engineering Practicum, Revature; July-August 2026 | August FSR, Full-stack engineering practicum |
| Graduate study | M.S. Computer Science, Georgia Institute of Technology; expected December 2027 | All three Victor resume PDFs, Education |
| Undergraduate degree | B.S. Computer Science, University of Maryland, Baltimore County | All three Victor resume PDFs, Education |

The PDFs call the Georgia Tech focus "Systems & Architecture"; the previous website calls it AI. Use "M.S. Computer Science, expected December 2027" until Victor confirms the current focus and its official wording. Only the June 4 copy includes the UMBC graduation year, so the website can omit that year until confirmed.

Suggested compact introduction:

> I'm a backend-leaning full-stack engineer at Paradigm Testing. I work on certification software with Java, Spring Boot, React, and PostgreSQL, and build tools in Go and TypeScript. My work includes multi-tenant systems, automated testing, and production delivery.

Suggested experience copy for the screen:

**Senior Backend Engineer · Paradigm Testing · May 2024-present**

- Lead architecture, priorities, and production readiness across certification SaaS products.
- Led a Spring MVC rewrite into five Spring Boot 3 services with tenant-aware architecture.
- Built a React/Spring Boot exam scheduling workflow with accommodation controls and conflict handling.
- Built merge-gated CI/CD and automated tests, and developed authenticated real-time exam video delivery.

**Software Developer · Paradigm Testing · June 2022-May 2024**

- Built backend systems for oral examinations, including video capture, notifications, and proctor recordings.
- Led JPA adoption and improved the waiting-room system under concurrent exam traffic.

**Full-Stack Engineering Practicum · Revature · July-August 2026**

- Built a Next.js trainer analytics dashboard with server-driven filtering, accessible data views, and tests.
- Rebuilt a Next.js/FastAPI quiz flow with session resume and end-to-end browser coverage.

These proposed bullets shorten the source wording. They avoid adding outcomes or measurements that the resumes do not provide. Keep project details in the computer's Projects app, where visitors can follow the public repositories.

## Changes to consider for the resume itself

The August version fits a lot onto one page. The rendered page has clear section boundaries, but the nine current-role bullets dominate the middle and the project entries are tightly packed. I would reduce the current role to five or six bullets before making the type smaller. Keep the full version as a source document for role-specific applications.

1. **Put the current role before the skills inventory.** The leadership and shipped software provide more context than four dense skill rows. Move the most relevant tools into a short skills section after experience, or retain a compact line near the top.
2. **Choose the opening for the job.** The August summary supports a full-stack application; the June summary supports a backend application. For the website, the shorter introduction above leaves space for a visitor to explore. Avoid making the public portfolio sound like an application for only one opening.
3. **Keep one claim per bullet.** The June file-lock bullet combines diagnosis, error reduction, billing, client confidence, and reprocessing. The August version is easier to scan. An even shorter version is: "Diagnosed and fixed a multithreaded AWS file-lock failure affecting certification clients." Add the documented error measurement only when its scope and comparison period can be explained.
4. **Keep release claims scoped.** The June copy says production regressions fell to zero across six releases. The August copy narrows this to "without covered-workflow regressions." Preserve that narrower scope. Avoid a general reliability guarantee from a limited release sample.
5. **Date test counts or remove them from static copy.** MailIt changes from 369 tests in June to 523 in August. Both can be accurate for their dates. A current public claim needs a repository revision and a repeatable command; otherwise say what the tests cover. The same applies to the Citybase and Fix YouTube counts.
6. **Explain internal language for an outside reader.** Replace "Inf/Sec" with "information security" and "ktest validation" with a brief description of the validation environment. The public portfolio can summarize proctoring integration without internal environment names or vendor coordination detail.
7. **Describe the validation work through its result.** For public copy, the pilot-gate bullet can become: "Built a release checklist covering tenant onboarding, exam recovery, scoring, and audit reconstruction." The source's specific security incident should be used only if its detail is appropriate to share publicly.
8. **Separate practicum from employment.** The August resume already labels Revature as a practicum. Preserve that label and its dates on the site; do not present it as another employment role.
9. **Keep the selected projects selective.** MailIt, Citybase, and Fix YouTube show different kinds of work. Give each a short problem statement and a repository link. For a backend application, FinScan or ExamMetrics from the June version may be more relevant than the browser extension.

For the virtual computer, use real text with adjustable layout, short sections, and visible dates. A page image would make the dense PDF harder to read on a phone. The public panel needs professional links and email; it does not need to reproduce every contact or availability field from the application resume.

Before rewriting the original resume, confirm the current job title, Georgia Tech focus, UMBC graduation year, and which project measurements Victor wants to maintain. The source files are available for that next revision.
