import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

const SECTIONS = ["s1", "s2", "s3", "s4", "s5", "s6", "s7"] as const;

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Termos de Uso — Learn Buddy"
        description="Regras de uso da plataforma de estudos com IA Learn Buddy: conta, conteúdo, anúncios, assinatura Buddy e responsabilidades."
        path="/terms"
      />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
          {t("header.back")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold mb-8">{t("terms.title")}</h1>

        <div className="space-y-6">
          {SECTIONS.map((s) => (
            <section key={s} className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-xl font-bold text-primary mb-3">{t(`terms.${s}Title`)}</h2>
              <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{t(`terms.${s}Body`)}</p>
            </section>
          ))}

          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-bold text-primary mb-3">{t("terms.contactTitle")}</h2>
            <p className="text-muted-foreground">studdybuddy@gmail.com</p>
            <Link to="/privacy" className="text-primary hover:underline font-medium">
              {t("footer.privacy", "Política de Privacidade")}
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
