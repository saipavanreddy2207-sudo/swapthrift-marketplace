import { AlertTriangle, FileText, Scale } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { CREATOR, creatorMailto } from '../config/creator'

const legalPages = {
  impressum: {
    title: 'Impressum',
    subtitle: 'Angaben gemäß § 5 DDG',
    sections: [
      {
        heading: 'Anbieterkennzeichnung',
        paragraphs: [
          `SwapThrift wird als privates Projekt betrieben. Founder & Creator: ${CREATOR.name}.`,
          `Kontakt: ${CREATOR.email} · Projektpostfach: kontakt@swapthrift.de`,
          'Die vollständigen Anbieterangaben (ladungsfähige Anschrift und ggf. Registerangaben) werden vor dem öffentlichen Launch von einer Rechtsberatung geprüft und ergänzt.',
        ],
      },
      {
        heading: 'Haftung für Inhalte und Links',
        paragraphs: [
          'Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.',
          'Für Inhalte verlinkter externer Websites ist ausschließlich deren jeweiliger Betreiber verantwortlich.',
        ],
      },
      {
        heading: 'Urheberrecht',
        paragraphs: [
          'Die durch SwapThrift erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht. Eine Vervielfältigung, Bearbeitung oder Verbreitung bedarf der Zustimmung des jeweiligen Rechteinhabers.',
        ],
      },
    ],
  },
  datenschutz: {
    title: 'Datenschutzerklärung',
    subtitle: 'Informationen nach Art. 13 DSGVO',
    sections: [
      {
        heading: 'Verantwortlicher und Zwecke',
        paragraphs: [
          'Verantwortlich für die Datenverarbeitung auf SwapThrift ist der Betreiber der Plattform. Wir verarbeiten personenbezogene Daten nur, soweit dies für die Registrierung, die Abwicklung von Inseraten, die Kommunikation und den Betrieb der Plattform erforderlich ist.',
        ],
      },
      {
        heading: 'Welche Daten wir verarbeiten',
        paragraphs: [
          'Bei der Registrierung: Name, E-Mail-Adresse, Ort, Postleitzahl und optional Telefonnummer. Beim Erstellen eines Inserats: Artikelangaben, Bilder und Standortangaben. Beim Besuch der Website: technische Zugriffsdaten wie IP-Adresse, Browser und Zeitpunkt.',
        ],
      },
      {
        heading: 'Rechtsgrundlagen',
        paragraphs: [
          'Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung), lit. c (rechtliche Verpflichtungen) sowie lit. f (berechtigtes Interesse am sicheren Betrieb). Eine Einwilligung wird dort eingeholt, wo sie gesetzlich erforderlich ist.',
        ],
      },
      {
        heading: 'Speicherdauer und Ihre Rechte',
        paragraphs: [
          'Daten werden nur so lange gespeichert, wie dies für die jeweiligen Zwecke erforderlich ist. Sie haben das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit sowie das Recht, einer Verarbeitung zu widersprechen.',
          'Zuständige Aufsichtsbehörde ist die Datenschutzbehörde des Bundeslandes, in dem der Anbieter seinen Sitz hat.',
        ],
      },
    ],
  },
  agb: {
    title: 'Allgemeine Geschäftsbedingungen',
    subtitle: 'Für die Nutzung des SwapThrift-Marktplatzes',
    sections: [
      {
        heading: 'Geltungsbereich',
        paragraphs: [
          'Diese Allgemeinen Geschäftsbedingungen gelten für die Nutzung von SwapThrift durch natürliche und juristische Personen. Abweichende Bedingungen der Nutzer:innen finden keine Anwendung.',
        ],
      },
      {
        heading: 'Registrierung und Konto',
        paragraphs: [
          'Die Nutzung setzt ein gültiges Nutzerkonto voraus. Bei der Registrierung sind wahrheitsgemäße Angaben zu machen. Nutzer:innen sind verpflichtet, ihre Zugangsdaten geheim zu halten.',
        ],
      },
      {
        heading: 'Inserate und Verkauf',
        paragraphs: [
          'Verkäufer:innen sind für die Richtigkeit und Vollständigkeit ihrer Angebote verantwortlich. Es dürfen keine gesetzlich verbotenen oder sittenwidrigen Gegenstände angeboten werden. Die Übergabe erfolgt direkt zwischen Käufer:in und Verkäufer:in.',
        ],
      },
      {
        heading: 'Kosten und Haftung',
        paragraphs: [
          'Die Veröffentlichung privater Inserate ist derzeit kostenfrei. SwapThrift haftet nicht für die Beschaffenheit oder Eignung der angebotenen Gegenstände; es besteht kein eigenes Kaufvertragsverhältnis zwischen SwapThrift und den Nutzer:innen.',
        ],
      },
      {
        heading: 'Schlussbestimmungen',
        paragraphs: [
          'Es gilt deutsches Recht. Sollten einzelne Bestimmungen unwirksam sein, bleibt die Wirksamkeit der übrigen Regelungen unberührt.',
        ],
      },
    ],
  },
  widerrufsbelehrung: {
    title: 'Widerrufsbelehrung',
    subtitle: 'Informationen zum Widerrufsrecht',
    sections: [
      {
        heading: 'Widerrufsrecht bei Fernabsatzgeschäften',
        paragraphs: [
          'Bei einem Fernabsatzvertrag haben Verbraucher:innen grundsätzlich das Recht, binnen 14 Tagen ohne Angabe von Gründen zu widerrufen. Die Widerrufsfrist beginnt mit Erhalt dieser Belehrung bzw. mit Erhalt der Ware.',
        ],
      },
      {
        heading: 'Ausübung des Widerrufs',
        paragraphs: [
          'Zur Ausübung des Widerrufs ist eine eindeutige Erklärung gegenüber der Verkäufer:in erforderlich. Sie können dafür das bereitgestellte Muster-Widerrufsformular verwenden, sind dazu aber nicht verpflichtet.',
        ],
      },
      {
        heading: 'Ausnahmen',
        paragraphs: [
          'Das Widerrufsrecht besteht nicht bei Verträgen über Waren, die nach Kundenspezifikation angefertigt wurden, leicht verderblich sind oder bei denen es sich um gebrauchte Sachen handelt, die ausdrücklich als solche verkauft wurden, sofern die gesetzlichen Voraussetzungen erfüllt sind.',
        ],
      },
      {
        heading: 'Wichtiger Hinweis',
        paragraphs: [
          'Da SwapThrift Privatpersonen beim Direktverkauf zusammenbringt, richtet sich das Widerrufsrecht nach der jeweiligen Konstellation. Die endgültige Fassung dieser Belehrung muss vor dem Launch juristisch geprüft werden.',
        ],
      },
    ],
  },
  cookies: {
    title: 'Cookie-Richtlinie',
    subtitle: 'Umgang mit lokalen Speicherdaten',
    sections: [
      {
        heading: 'Technisch notwendige Speicherung',
        paragraphs: [
          'SwapThrift verwendet localStorage für deinen Warenkorb, deine Favoriten und deinen Anmeldetoken. Diese Daten verbleiben auf deinem Gerät und werden nicht ohne deine Zustimmung an Dritte weitergegeben.',
        ],
      },
      {
        heading: 'Session und Anmeldung',
        paragraphs: [
          'Zur Aufrechterhaltung deiner Anmeldung wird ein Authentifizierungs-Cookie gesetzt. Ohne diese technisch notwendige Speicherung kann der Login nicht funktionieren.',
        ],
      },
      {
        heading: 'Analyse und Tracking',
        paragraphs: [
          'Derzeit werden keine Analyse- oder Werbe-Cookies eingesetzt. Sollte sich dies ändern,holen wir zuvor deine Einwilligung im Rahmen eines Cookie-Banners ein.',
        ],
      },
    ],
  },
  'community-richtlinien': {
    title: 'Community-Richtlinien',
    subtitle: 'Respektvoll miteinander umgehen',
    sections: [
      {
        heading: 'Respekt und Fairness',
        paragraphs: [
          'Behandle andere Nutzer:innen immer respektvoll. Beleidigungen, Diskriminierung, Drohungen und Belästigungen sind nicht erlaubt.',
        ],
      },
      {
        heading: 'Ehrliche Kommunikation',
        paragraphs: [
          'Beschreibe Artikel wahrheitsgemäß und antworte höflich auf Anfragen. Irreführende Angaben, Fake-Angebote und betrügerische Absichten führen zum Ausschluss.',
        ],
      },
      {
        heading: 'Datenschutz',
        paragraphs: [
          'Veröffentliche keine fremden personenbezogenen Daten und teile deine eigenen Kontaktdaten nur im Rahmen einer beabsichtigten Transaktion.',
        ],
      },
      {
        heading: 'Konsequenzen bei Verstößen',
        paragraphs: [
          'Verstöße können zur Entfernung von Inhalten, zur Einschränkung von Funktionen oder zur Sperrung des Kontos führen.',
        ],
      },
    ],
  },
  'marktplatzregeln': {
    title: 'Marktplatzregeln',
    subtitle: 'Welche Angebote erlaubt sind',
    sections: [
      {
        heading: 'Erlaubte Artikel',
        paragraphs: [
          'Du darfst gebrauchte und neue Gegenstände aus privatem Besitz anbieten, sofern deren Verkauf gesetzlich zulässig ist. Dazu zählen etwa Kleidung, Möbel, Bücher, Elektronik und Hobbygegenstände.',
        ],
      },
      {
        heading: 'Verbotene Artikel',
        paragraphs: [
          'Nicht erlaubt sind insbesondere Waffen, Drogen, gefälschte Markenware, gestohlene Gegenstände, medizinische Produkte ohne Zulassung, Tiere, Pflanzen unter Artenschutz sowie Inhalte mit Gewalt- oder Hassdarstellungen.',
        ],
      },
      {
        heading: 'Pflichten der Verkäufer:innen',
        paragraphs: [
          'Gib den Zustand, den Preis, den Standort und die Übergabeoptionen korrekt an. Verwende eigene Fotos oder Bilder, an denen du die Nutzungsrechte hast. Der Preis muss im Inserat klar und gut sichtbar genannt werden.',
        ],
      },
      {
        heading: 'Sicher handeln',
        paragraphs: [
          'Bleibe bei der Kommunikation auf der Plattform. Nutze nachvollziehbare Versandarten, versichere wertvolle Sendungen und prüfe die Identität der Gegenseite bei Abholungen.',
        ],
      },
      {
        heading: 'Meldungen',
        paragraphs: [
          'Verdächtige Angebote kannst du direkt über das Inserat melden. Unser Team prüft Meldungen und entfernt rechtswidrige Inhalte.',
        ],
      },
    ],
  },
}

const today = new Date().toLocaleDateString('de-DE')

const slugList = [
  ['impressum', 'Impressum'],
  ['datenschutz', 'Datenschutz'],
  ['agb', 'AGB'],
  ['widerrufsbelehrung', 'Widerrufsbelehrung'],
  ['cookies', 'Cookies'],
  ['community-richtlinien', 'Community-Richtlinien'],
  ['marktplatzregeln', 'Marktplatzregeln'],
]

export default function Legal() {
  const { slug } = useParams()
  const page = legalPages[slug]

  if (!page) {
    return (
      <div className="container-x py-16">
        <div className="surface mx-auto max-w-xl p-10 text-center">
          <FileText className="mx-auto size-10 text-brand-600" />
          <h1 className="mt-4 text-2xl font-extrabold">Seite nicht gefunden</h1>
          <p className="mt-2 text-sm text-slate-600">Diese Rechtsseite existiert nicht.</p>
          <Link to="/rechtliches/impressum" className="btn-primary mt-6">Zum Impressum</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container-x py-10">
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="card space-y-1 p-4" aria-label="Rechtliche Informationen">
            <p className="px-3 pb-2 text-xs font-extrabold tracking-wider text-slate-400 uppercase">Rechtliches</p>
            {slugList.map(([key, label]) => (
              <Link
                key={key}
                to={`/rechtliches/${key}`}
                className={`block rounded-xl px-3 py-2 text-sm font-bold transition-colors ${key === slug ? 'bg-brand-800 text-white' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-900'}`}
              >
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        <article className="min-w-0 surface p-6 sm:p-10">
          <div className="mb-8 flex items-start gap-3 rounded-2xl border border-sand-300 bg-sand-100 p-4">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-sand-700" />
            <p className="text-sm leading-relaxed text-brand-950">
              <strong>Hinweis:</strong> Diese Texte sind strukturelle Entwürfe für den Marktplatz. Sie müssen
              vor dem öffentlichen Launch von einer Rechtsanwaltskanzlei geprüft und an die tatsächlichen
              Betreiberangaben angepasst werden.
            </p>
          </div>
          <p className="text-xs font-extrabold tracking-widest text-brand-600 uppercase">{page.subtitle}</p>
          <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{page.title}</h1>
          <p className="mt-4 text-xs text-slate-500">Stand: {today}</p>

          <div className="mt-10 space-y-10">
            {page.sections.map((section, index) => (
              <section key={section.heading}>
                <h2 className="flex items-center gap-3 text-xl font-extrabold">
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand-50 text-sm text-brand-700">{index + 1}</span>
                  {section.heading}
                </h2>
                <div className="mt-4 space-y-3 pl-0 sm:pl-11">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-7 text-slate-600">{paragraph}</p>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-12 flex items-center gap-2 border-t border-brand-900/8 pt-6 text-sm text-slate-500">
            <Scale className="size-4 text-brand-600" /> Fragen zu diesen Unterlagen? Schreib an den Founder &amp; Creator{' '}
            <a href={creatorMailto} className="link-brand">{CREATOR.email}</a>
          </div>
        </article>
      </div>
    </div>
  )
}
