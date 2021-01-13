import type { Resource, TFunction } from "i18next";
import i18next from 'i18next';
import { readable } from 'svelte/store';

export const translate = (
  translations: Resource,
  moreTranslations: Resource[] = [],
  locale = "en_us"
) =>
  readable<TFunction>(
    () => {},
    (set) => {
      i18next
        .init({
          lng: locale,
          resources: translations,
        })
        .then((t) => {
          for (const translation of moreTranslations)
            for (const languageName in translation) {
              const language = translation[languageName];

              for (const namespaceName in language) {
                const resouceBundle = language[namespaceName];

                i18next.addResourceBundle(
                  languageName,
                  namespaceName,
                  resouceBundle,
                  true
                );
              }
            }

          set(t);
        });
    }
  );
