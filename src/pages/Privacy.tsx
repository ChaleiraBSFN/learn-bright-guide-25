import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { SEO } from "@/components/SEO";

export default function Privacy() {
  const { t } = useTranslation();

  const sections = [
    { title: "s1Title", body: "s1Body" },
    { title: "s2Title", intro: "s2Intro", items: ["s2L1", "s2L2", "s2L3", "s2L4", "s2L5"] },
    { title: "s3Title", intro: "s3Intro", items: ["s3L1", "s3L2", "s3L3", "s3L4", "s3L5"], outro: "s3Outro" },
    { title: "s4Title", body: "s4Body", items: ["s4L1", "s4L2", "s4L3"], outro: "s4Outro" },
    { title: "s5Title", body: "s5Body" },
    { title: "s6Title", body: "s6Body" },
    { title: "s7Title", intro: "s7Intro", items: ["s7L1", "s7L2", "s7L3", "s7L4", "s7L5"] },
    { title: "s8Title", intro: "s8Intro", items: ["s8L1", "s8L2", "s8L3", "s8L4", "s8L5"], outro: "s8Outro" },
    { title: "s9Title", intro: "s9Intro", items: ["s9L1", "s9L2", "s9L3"] },
    { title: "s10Title", body: "s10Body" },
    { title: "s11Title", body: "s11Body" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO title="Política de Privacidade — Learn Buddy" description="Como o Learn Buddy coleta, usa e protege seus dados. Política de privacidade da plataforma de estudos com IA." path="/privacy" />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <Link to="/" className="inline-flex items-center gap-2 text-primary font-semibold mb-8 hover:underline">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          {t("header.back")}
        </Link>

        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground mb-2">{t("privacy.title")}</h1>
        <p className="text-muted-foreground mb-8">{t("privacy.lastUpdate")}</p>

        <div className="space-y-8">
          {sections.map((s, i) => (
            <section key={i} className="border-2 border-foreground rounded-xl p-6 bg-card">
              <h2 className="text-xl font-bold text-primary mb-3">{t(`privacy.${s.title}`)}</h2>
              {s.body && <p className="text-muted-foreground leading-relaxed">{t(`privacy.${s.body}`)}</p>}
              {s.intro && <p className="text-muted-foreground leading-relaxed mb-3">{t(`privacy.${s.intro}`)}</p>}
              {s.items && (
                <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-2 mt-2">
                  {s.items.map((k) => (
                    <li key={k}>{t(`privacy.${k}`)}</li>
                  ))}
                </ul>
              )}
              {s.outro && <p className="text-muted-foreground leading-relaxed mt-3">{t(`privacy.${s.outro}`)}</p>}
            </section>
          ))}

          <section className="border-2 border-foreground rounded-xl p-6 bg-card">
            <h2 className="text-xl font-bold text-primary mb-3">{t("privacy.s12Title")}</h2>
            <p className="text-muted-foreground leading-relaxed">{t("privacy.s12Intro")}</p>
            <div className="mt-3 space-y-1 text-muted-foreground">
              <p><strong>{t("privacy.s12Resp")}</strong> Equipe de Desenvolvimento da Learn Buddy (EDLB)</p>
              <p><strong>{t("privacy.s12Web")}</strong> studdybuddy.com.br</p>
              <p><strong>{t("privacy.s12Email")}</strong> studdybuddy@gmail.com</p>
            </div>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-foreground/20 text-center">
          <p className="text-sm text-muted-foreground">{t("privacy.footer")}</p>
          <Link to="/" className="inline-block mt-4 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl border-2 border-foreground hover:opacity-90 transition-opacity">
            {t("privacy.backHome")}
          </Link>
        </div>
      </div>
    </div>
  );
}
