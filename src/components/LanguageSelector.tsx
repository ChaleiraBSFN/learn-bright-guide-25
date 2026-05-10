import { useTranslation } from 'react-i18next';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

const FlagBR = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="20" fill="#009c3b" />
    <path d="M15 2 L28 10 L15 18 L2 10 Z" fill="#ffdf00" />
    <circle cx="15" cy="10" r="5.5" fill="#002776" />
  </svg>
);

const FlagUS = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="20" fill="#b22234" />
    {[0, 2, 4, 6, 8, 10, 12].map((y) => (
      <rect key={y} y={y * 20 / 13} width="30" height={20 / 13} fill="#fff" />
    ))}
    <rect width="12" height="10.77" fill="#3c3b6e" />
  </svg>
);

const FlagES = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="5" y="0" fill="#aa151b" />
    <rect width="30" height="10" y="5" fill="#f1bf00" />
    <rect width="30" height="5" y="15" fill="#aa151b" />
  </svg>
);

const FlagFR = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="10" height="20" x="0" fill="#002395" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#ed2939" />
  </svg>
);

const FlagDE = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="6.67" y="0" fill="#000" />
    <rect width="30" height="6.67" y="6.67" fill="#dd0000" />
    <rect width="30" height="6.67" y="13.33" fill="#ffce00" />
  </svg>
);

const FlagIT = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="10" height="20" x="0" fill="#009246" />
    <rect width="10" height="20" x="10" fill="#fff" />
    <rect width="10" height="20" x="20" fill="#ce2b37" />
  </svg>
);

const FlagJP = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="20" fill="#fff" />
    <circle cx="15" cy="10" r="6" fill="#bc002d" />
  </svg>
);

const FlagCN = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="20" fill="#de2910" />
    <g fill="#ffde00">
      <polygon points="6,3 7.5,7.5 3,5 9,5 4.5,7.5" />
      <polygon points="12,1 12.5,2.5 11,2" />
      <polygon points="14,2 14.3,3.3 13.2,2.6" />
      <polygon points="14,4 14.3,5.3 13.2,4.6" />
      <polygon points="12,5 12.3,6.3 11.2,5.6" />
    </g>
  </svg>
);

const FlagRU = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 30 20" className={className} aria-hidden="true">
    <rect width="30" height="6.67" y="0" fill="#fff" />
    <rect width="30" height="6.67" y="6.67" fill="#0039a6" />
    <rect width="30" height="6.67" y="13.33" fill="#d52b1e" />
  </svg>
);

type FlagComponent = React.FC<{ className?: string }>;

type LanguageOption = {
  code: string;
  name: string;
  Flag: FlagComponent;
};

const languages: LanguageOption[] = [
  { code: 'pt-BR', name: 'Português (BR)', Flag: FlagBR },
  { code: 'en', name: 'English', Flag: FlagUS },
  { code: 'es', name: 'Español', Flag: FlagES },
  { code: 'fr', name: 'Français', Flag: FlagFR },
  { code: 'de', name: 'Deutsch', Flag: FlagDE },
  { code: 'it', name: 'Italiano', Flag: FlagIT },
  { code: 'ja', name: '日本語', Flag: FlagJP },
  { code: 'zh', name: '中文', Flag: FlagCN },
  { code: 'ru', name: 'Русский', Flag: FlagRU },
];

function resolveLanguage(code: string): LanguageOption {
  const normalized = code === 'pt' ? 'pt-BR' : code;
  return languages.find((lang) => lang.code === normalized) || languages[0];
}

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const currentLanguage = resolveLanguage(i18n.language);
  const CurrentFlag = currentLanguage.Flag;

  const handleLanguageChange = (langCode: string) => {
    localStorage.setItem('i18nextLng', langCode);
    i18n.changeLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title={currentLanguage.name}>
          <CurrentFlag className="h-5 w-[30px] rounded-[2px]" />
          <span className="sr-only">Select language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-popover z-50">
        {languages.map((lang) => {
          const Flag = lang.Flag;

          return (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleLanguageChange(lang.code)}
              className={`cursor-pointer ${resolveLanguage(i18n.language).code === lang.code ? 'bg-accent' : ''}`}
            >
              <Flag className="mr-2 h-4 w-6 rounded-[2px]" />
              {lang.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
