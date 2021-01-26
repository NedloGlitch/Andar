import { Markup, Telegraf } from 'telegraf'; //Telegraf and Keyboard Markup
import { config } from 'dotenv'; //BOT_TOKEN safe storing
import { CallbackQuery, ExtraReplyMessage, Message, User } from 'telegraf/typings/telegram-types';
import { createBotUser, getBotUserByUserId, addUserEXP } from './database';
import { getPhrase, Phrase } from './i18n'; //Locale provider
import { testKeyboard, menuKeyboard, returnKeyboard } from './keyboards'
import type CustomContext from './CustomContext';
//import Markup from 'telegraf/typings/telegram'

//I do comments very bad.  Be prepared.

config(); //DOTENV .env file load function


/*  ---TELEGRAF SECTION--- */
//Telegraf State system setup
type State = 'menu' | 'setup' | 'first' | 'second';
const user_states = new Map<number, State>(); // TEMPLATE FOR STATE SET\GET: key: chatId, value: State
//const anket = new Map<number, string[]>();


//Telegraf bot creation
const bot = new Telegraf<CustomContext>(process.env.BOT_TOKEN as string); // Creates bot
bot.launch(); // Launches bot

//Code beautify
bot.use((ctx, next) => {
  ctx.replyWithPhrase = async (phrase: Phrase, extra?: ExtraReplyMessage) => {
    return await ctx.reply(await getPhrase(phrase, (ctx.from as User).id), extra);
  }

  ctx.replyWithExperience = async (currentExperience: number) => {
    let curExp = currentExperience
    let expLine = ""
    for (let i = 0; i < curExp % 10; i++)    expLine = expLine + " █";
    for (let i = curExp % 10; i < 10; i++)       expLine = expLine + " -";
    return await ctx.reply(await getPhrase("lvl", (ctx.from as User).id)
      + ((curExp / 10) - 0.5).toFixed(0) + " [" + expLine + " ] " + curExp % 10 + "/10");
  }
  next();
});

//Bot action on /start command
bot.start(async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇸")]))
  user_states.set(ctx.from.id, 'setup')
})


/* --BOT ON TEXT SECTION-- */
//set's special handlers for scenes
bot.on('text', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (await getBotUserByUserId(ctx.from.id) == undefined) {      //NO USER IN DATABASE CHECK
    await ctx.reply("❌ Looks like you aren't registered in database, we will start over", Markup.removeKeyboard())
    await ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇸")]))
    user_states.set(ctx.from.id, 'setup')
  }
  else {
    //let anket:string[] = [ctx.message.text];
    const user_state = user_states.get(ctx.from.id);
    switch (user_state) {
      case 'setup': //setup has no text commands
        break;
      case 'first':
        await anket_handler(ctx);
        break;
      case 'second':
        await test_choice_handler(ctx);
        break;
      case 'menu':
        await menu_handler(ctx);
        break;
      //DEFAULT
      default:
        await ctx.replyWithPhrase("afterRestart", Markup.removeKeyboard())
        await ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
        user_states.set(ctx.from.id, 'menu');
        break;
    }
  }
})


/* --BOT CALLBACK HANDLER SECTION-- */
//Use special scenario for handling callback (scene specific)
bot.on('callback_query', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  switch (user_states.get(ctx.from.id)) {
    case "setup":
      await setup_callback_handler(ctx)
      break;
    case "second":
      await test_choice_callback_handler(ctx)
      break;
    //DEFAULT
    default:
      ctx.replyWithPhrase("badButton", Markup.removeKeyboard())
      ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
      user_states.set(ctx.from.id, 'menu');
      break;
  }
})






/* --BOT SCENE HANDLERS SECTION-- */

// -menu handler-
async function menu_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 

  //ANKET SCENARIO
  if (ctx.message.text == await getPhrase("anket", ctx.from.id)) {
    await ctx.replyWithPhrase("anketQuestion4", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'first');
  }


  //TEST SCENARIO
  else if (ctx.message.text == await getPhrase("takeTest", ctx.from.id)) {
    await ctx.reply("↴", await returnKeyboard(ctx.from.id))
    ctx.reply("What creature can fly?", //line continues below
      Markup.inlineKeyboard([CLB("Cat"), CLB("Fish"), CLB("Bird"), CLB("Snake")]));
    user_states.set(ctx.from.id, 'second'); //Go to second_handler
  }

  //MY LVL SCENARIO
  else if (ctx.message.text == await getPhrase("mylvl", ctx.from.id)) {
    let searchResult = await getBotUserByUserId(ctx.from.id)
    if (searchResult === undefined) {
      ctx.reply("No user found")
    }
    else {
      ctx.replyWithExperience(searchResult.exp)
    }
  }
  else {
    ctx.reply(await getPhrase("useButtons", ctx.from.id), await menuKeyboard(ctx.from.id));
  }
}

// -setup callback handler-
async function setup_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if ((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == "🇷🇺" || "🇺🇸") {
    await createBotUser({
      userId: ctx.from.id,
      news: true,
      language: (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data as "ru" || "en",
      exp: 10
    });
    ctx.deleteMessage()
    ctx.replyWithPhrase("userCreated", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu')
  }
  else
    ctx.reply("Something went wrong when creating a user")
}


async function anket_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    await ctx.replyWithPhrase("thankyou", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    await bot.telegram.sendMessage("512554939", ctx.message.text)
  }
}
// -test1 question scene- 
/*async function anket_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else if (ctx.message.text == "Andar") {
    ctx.reply("Ye, you right!\n(Go back in menu or try again)", await testKeyboard(ctx.from.id))
    await addUserEXP(ctx.from.id, 1);
  }
  else if(anket.length == 0){
   ctx.replyWithPhrase("anketQuestion1")
  } 
  else if(anket.get(ctx.from.id) == undefined || anket.get(ctx.from.id)?.length == 0){
    anket.set(ctx.from.id, [ctx.message.text])
    ctx.replyWithPhrase("anketQuestion2")
  }
  else if(anket.get(ctx.from.id)?.length == 1) {
    anket.set(ctx.from.id)
    ctx.replyWithPhrase("anketQuestion3")
  }
  else if(anket.get(ctx.from.id)?.length == 2) {
    anket.set(ctx.from.id, [ctx.message.text])
    ctx.replyWithPhrase("anketQuestion3")
    await ctx.replyWithPhrase("thankyou", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    await bot.telegram.sendMessage("512554939", anket.join("\n"))
  }
  else
    ctx.reply("something went wrong")
}*/

// -test2 question scene-
async function test_choice_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
    ctx.replyWithPhrase("useButtons", await menuKeyboard(ctx.from.id))
}

async function test_choice_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  const answer = "Bird"
  if ((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == answer) { //waiting for answer(callback)
    ctx.deleteMessage()
    ctx.reply('https://i.redd.it/houw2o6e6ro21.jpg', await menuKeyboard(ctx.from.id))
    await addUserEXP(ctx.from.id, 2);
    user_states.set(ctx.from.id, 'menu'); //Go to menu
  }
  else {
    ctx.deleteMessage()
    ctx.reply("You answered wrong. \nBack to Menu", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu'); //Go to menu
  }
}


/* ---Quality of life functions--- */
/*
function choice(ctx: Context){
  console.log("message from test point")
  let streng:string
  getPhrase("menu", ctx.from.id).then( (value)=>{
    streng = value;   
    ctx.reply(streng)
    console.log("message within, observe - " + value)
  })
  console.log("message from end of test point")
}*/

function CLB(name: string) { //CallBack button fast creation
  return Markup.button.callback(name, name)
}
/*
import {tempStorage} from './cache'

(global as any).getMap = () => {
  console.log(tempStorage)
}
*/

//import { Context } from 'telegraf/typings/context'; //Telegraf Context

//import { Users } from './entity/Users';
//import { Questions } from './entity/Questions';

//512554939