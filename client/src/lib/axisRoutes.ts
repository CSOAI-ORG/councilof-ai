import AXIS_ROUTES from "../../../public/interop/axis-routes.json";
import { axisHref } from "./axisHref";

/**
 * The axis route map, published by the generator that writes the axis pages.
 *
 * WHY A BUILT FILE. Some surfaces must render with no network call at all —
 * the working-groups registry is a dated document that renders statically, and
 * its test asserts that opening it fetches nothing. Those surfaces still have
 * to link a URL that exists. The map below is written by
 * scripts/surface/build-axis-pages.mjs from the SAME payload that renders
 * public/axis/*.html, on every build, so a route can never disagree with the
 * page it points at.
 *
 * WHY NOT A TYPED LIST. A hand-kept list of axis slugs is a list that rots: the
 * board grows an axis, the list does not, and the link 404s. That is exactly
 * what happened — nine measured-subject axes were linked to a /gspc/ route that
 * is not prerendered, and twenty of the working-groups links were 404s.
 *
 * THE ENDPOINT STILL WINS. This map is a build-time convenience, not an
 * authority. A surface that already holds the live board payload should call
 * axisHref() with that row instead; this module is for the surfaces that do
 * not have one.
 */

interface AxisRouteRow {
  axis?: string;
  kind?: string;
  public_pages?: string;
}

const ROWS: AxisRouteRow[] = Array.isArray((AXIS_ROUTES as { axes?: unknown }).axes)
  ? ((AXIS_ROUTES as { axes: AxisRouteRow[] }).axes ?? [])
  : [];

/** as_of of the payload the map was built from. */
export const AXIS_ROUTES_AS_OF = (AXIS_ROUTES as { as_of?: string | null }).as_of ?? null;

/**
 * The route for an axis, or null when the axis has no public page.
 *
 * null is a real answer: an owner-held axis has no page and must not be
 * linked.
 */
export function axisRoute(axis: string): string | null {
  const row = ROWS.find((r) => r && r.axis === axis);
  if (!row) return null;
  return axisHref(row);
}

/** The axis ids the map knows about. */
export const KNOWN_AXIS_IDS: readonly string[] = ROWS.map((r) => r.axis).filter(
  (a): a is string => typeof a === "string",
);
