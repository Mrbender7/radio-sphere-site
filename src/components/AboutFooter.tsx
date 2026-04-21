import { useTranslation } from "@/contexts/LanguageContext";

export function AboutFooter() {
  const { t } = useTranslation();
  const createdBy = t("footer.createdBy");
  const [createdByPrefix, createdBySuffix] = createdBy.split("Franck Malherbe");

  return (
    <>
      {/* Copyright */}
      <div className="text-center mb-6 select-none space-y-1">
        <p className="text-[10px] text-muted-foreground">
          © {new Date().getFullYear()} RadioSphere.be — {createdByPrefix}
          <a href="https://franckmalherbe.be" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            Franck Malherbe
          </a>
          {createdBySuffix}
        </p>
        <p className="text-[10px] text-muted-foreground">
          {t("footer.poweredByPrefix")}
          <a
            href="https://www.radio-browser.info/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Radio Browser
          </a>
          {t("footer.poweredBySuffix")}
        </p>
      </div>

      {/* Social links */}
      <div className="flex items-center justify-center gap-4 pt-2 pb-4">
        <a
          href="https://www.facebook.com/profile.php?id=61575475057830"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Facebook"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
        </a>
        <a
          href="https://www.instagram.com/radiosphere.be/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Instagram"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
        <a
          href="https://bsky.app/profile/radiospherebe.bsky.social"
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-primary transition-colors"
          aria-label="Bluesky"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 10.8c-1.087-2.114-4.046-6.053-6.798-7.995C2.566.944 1.561 1.266.902 1.565.139 1.908 0 3.08 0 3.768c0 .69.378 5.65.624 6.479.785 2.627 3.673 3.563 6.691 3.21-4.476.726-8.056 2.525-4.174 7.07C6.72 24.438 10.16 21.086 12 18c1.84 3.086 5.147 6.376 8.859 2.527 3.882-4.545.302-6.344-4.174-7.07 3.018.353 5.906-.583 6.691-3.21.246-.828.624-5.789.624-6.479 0-.688-.139-1.86-.902-2.203-.659-.3-1.664-.62-4.3 1.24C16.046 4.748 13.087 8.687 12 10.8z"/></svg>
        </a>
      </div>
    </>
  );
}
