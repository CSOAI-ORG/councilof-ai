/**
 * Full site map in the footer — the former header mega menu (SITE_NAVIGATION).
 */
import { SITE_NAVIGATION } from "@/data/siteNavigation";
import { POSITIONING } from "@/lib/positioning";
import { lobbyHref, openLobby } from "@/lib/lobbyLink";
import { MegaDropdown } from "./NavMegaPanel";

export default function FooterSiteMap() {
  return (
    <section className="border-t border-gray-200 pt-10 mb-10" aria-labelledby="footer-site-map-heading">
      <div className="mb-6 text-center md:text-left">
        <h2 id="footer-site-map-heading" className="text-lg font-bold text-gray-900">
          Explore the site
        </h2>
        <p className="mt-1 text-sm text-gray-600 max-w-2xl">
          {POSITIONING.subhead} Council OS controls are in the header; the full estate map is below.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SITE_NAVIGATION.map((group) => (
          <MegaDropdown
            key={group.name}
            variant="footer"
            groupName={group.name}
            groupDescription={group.description}
            icon={group.icon}
            groupHref={group.href}
            items={group.submenu.map((sub) => ({
              name: sub.name,
              description: sub.description,
              href: sub.lobby ? lobbyHref({ ...sub.lobby, path: sub.href }) : sub.href,
              external: sub.external,
              onClick: sub.lobby
                ? (e) => {
                    e.preventDefault();
                    openLobby({ ...sub.lobby!, path: sub.href });
                  }
                : undefined,
            }))}
          />
        ))}
      </div>
    </section>
  );
}
