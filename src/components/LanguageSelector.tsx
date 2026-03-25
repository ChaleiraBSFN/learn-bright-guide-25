import { useTranslation } from 'react-i18next';
import type { ComponentType } from 'react';
import { BR, US, ES, FR, DE, IT, JP, CN, RU } from 'country-flag-icons/react/3x2';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

type FlagComponent = ComponentType<Record<string, unknown>>;

type LanguageOption = {
  code: string;
  name: string;
  Flag: FlagComponent;
};

const languages: LanguageOption[] = [
  { code: 'pt-BR', name: 'Português (BR)', Flag: BR },
  { code: 'en', name: 'English', Flag: US },
  { code: 'es', name: 'Español', Flag: ES },
  { code: 'fr', name: 'Français', Flag: FR },
  { code: 'de', name: 'Deutsch', Flag: DE },
  { code: 'it', name: 'Italiano', Flag: IT },
  { code: 'ja', name: '日本語', Flag: JP },
  { code: 'zh', name: '中文', Flag: CN },
  { code: 'ru', name: 'Русский', Flag: RU },
];

export function LanguageSelector() {
  const { i18n } = useTranslation();

  const currentLanguage = languages.find((lang) => lang.code === i18n.language) || languages[0];
  const CurrentFlag = currentLanguage.Flag;

  const handleLanguageChange = (langCode: string) => {
    localStorage.setItem('i18nextLng', langCode);
    i18n.changeLanguage(langCode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9" title={currentLanguage.name}>
          <CurrentFlag className="h-5 w-5 rounded-[2px] object-cover" aria-hidden="true" />
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
              className={`cursor-pointer ${lang.code === i18n.language ? 'bg-accent' : ''}`}
            >
              <Flag className="mr-2 h-4 w-6 rounded-[2px] object-cover" aria-hidden="true" />
              {lang.name}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
