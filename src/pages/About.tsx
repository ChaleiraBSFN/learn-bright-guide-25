import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Sobre e Contato — Learn Buddy"
        description="Quem somos, como o Learn Buddy cria conteúdo de estudo com IA e como falar com a nossa equipe."
        path="/about"
      />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
          {t("header.back")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{t("about.title")}</h1>

        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">{t("about.whoTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.whoBody")}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">{t("about.contentTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.contentBody")}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">{t("about.adsTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t("about.adsBody")}</p>
          </section>

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">{t("about.contactTitle")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("about.contactBody")}</p>
            <p className="mt-2 font-medium">studdybuddy@gmail.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
