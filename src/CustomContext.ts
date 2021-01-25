import type Context from "telegraf/typings/context";
import type { ExtraReplyMessage } from "telegraf/typings/telegram-types";
import type { Phrase } from "./i18n";


export default interface CustomContext extends Context {
    replyWithPhrase(phrase: Phrase, extra?: ExtraReplyMessage): ReturnType<Context["reply"]>;
    replyWithExperience(currentExperience:number): ReturnType<Context["reply"]>;
}