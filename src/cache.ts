//import { createClient, print } from 'redis';

//import { fchmod } from "fs/promises";
import { Locale } from "./i18n";


//const client = createClient();

const tempStorage = new Map<number, Locale>()


export const setUserLocaleToCache = (userId: number, locale: Locale) => {
    tempStorage.set(userId, locale)
}

export const getUserLocaleFromCache = (userId: number): Locale | undefined => tempStorage.get(userId)

export const flushCache = () => {
    tempStorage.clear()
}

setInterval(() => {
    flushCache();
}, 24 * 60 * 60 * 1000);
  