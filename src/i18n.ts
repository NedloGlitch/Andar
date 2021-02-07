//import { readdirSync } from 'fs'
import { configure, __ } from 'i18n'
import { join } from 'path'
import { getBotUserByUserId } from './database';
import { getUserLocaleFromCache, setUserLocaleToCache } from './cache';
import localizationExample from './localizationExample.json';

export type Phrase = keyof typeof localizationExample;
export type Locale = 'en' | 'ru' | 'ua';

configure({
    locales: ['en', 'ru', 'ua'],
    directory: join(__dirname, ".." , 'locale')
})

const FALLBACK_LOCALE: Locale = 'en';

export async function getPhrase(phrase: Phrase, userId: number) {
    const locale = await getUserLocale(userId);
    return __({ phrase, locale });
}

async function getUserLocale(userId: number): Promise<string> {
    let locale = getUserLocaleFromCache(userId);
    if (!locale) {
        const user = await getBotUserByUserId(userId);
        if (!user) return FALLBACK_LOCALE;
        else locale = user.language;
    }
    setUserLocaleToCache(userId, locale);
    return locale;
}

