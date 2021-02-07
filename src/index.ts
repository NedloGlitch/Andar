import { Markup, Telegraf } from 'telegraf'; //Telegraf and Keyboard Markup
import { config } from 'dotenv'; //BOT_TOKEN safe storing
import { CallbackQuery, ExtraReplyMessage, Message, User } from 'telegraf/typings/telegram-types';
import { createBotUser, getBotUserByUserId, addUserEXP, getAllUsers } from './database';
import { getPhrase, Phrase } from './i18n'; //Locale provider
import { adminKeyboard, menuKeyboard, returnKeyboard } from './keyboards'
import type CustomContext from './CustomContext';

config(); //DOTENV .env file load function


/*  ---TELEGRAF SECTION--- */
//Telegraf State system setup
type State = 'menu' | 'setup' | 'contact' | 'quiz' | 'admin' | 'sendnews' | 'reply';
const user_states = new Map<number, State>(); // TEMPLATE FOR STATE SET\GET: key: chatId, value: State
let reply_person:string


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
  ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇦")]))
  user_states.set(ctx.from.id, 'setup')
})


/* --BOT ON TEXT SECTION-- */
//set's special handlers for scenes
bot.on('text', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (await getBotUserByUserId(ctx.from.id) == undefined) {      //NO USER IN DATABASE CHECK
    await ctx.reply("❌ Looks like you aren't registered in database, we will start over", Markup.removeKeyboard())
    await ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇦")]))
    user_states.set(ctx.from.id, 'setup')
  }
  else {
    //let contact:string[] = [ctx.message.text];
    const user_state = user_states.get(ctx.from.id);
    switch (user_state) {
      case 'setup': //setup has no text commands
        break;
      case 'contact':
        await contact_handler(ctx);
        break;
      case 'quiz':
        await quiz_handler(ctx);
        break;
      case 'menu':
        await menu_handler(ctx);
        break;
      case 'admin':
        await admin_handler(ctx);
        break;
      case 'sendnews':
        await news_handler(ctx);
        break;
      case 'reply':
        await reply_handler(ctx);
        break;
      //DEFAULT
      default:
        await ctx.replyWithPhrase("afterRestart")
        await ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
        user_states.set(ctx.from.id, 'menu');
        if (ctx.from.id.toString() == process.env.ADMIN_ID as string){
          ctx.replyWithPhrase("admin", await adminKeyboard(ctx.from.id))
          user_states.set(ctx.from.id, 'admin');
        }
        break;
    }
  }
})


/* --BOT CALLBACK HANDLER SECTION-- */
//Use special scenario for handling callback (scene specific)
bot.on('callback_query', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  else
  switch (user_states.get(ctx.from.id)) {
    case "setup":
      await setup_callback_handler(ctx)
      break;
    case "quiz":
      await quiz_callback_handler(ctx)
      break;
    //DEFAULT
    default:
      if(ctx.from.id.toString() == process.env.ADMIN_ID as string) {
        ctx.replyWithPhrase("replyMessage", await returnKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, 'reply');
        reply_person = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data
        ctx.editMessageText((ctx.callbackQuery.message as Message.TextMessage).text + "\n"+ await getPhrase("replyDone", ctx.from.id));
      }
      else {
        ctx.replyWithPhrase("badButton", Markup.removeKeyboard())
        ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
        user_states.set(ctx.from.id, 'menu');
      }
      break;
  }
})

//NEWS PHOTO HANDLER
bot.on('photo', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if(user_states.get(ctx.from.id) == "sendnews"){
    if (ctx.message.caption == await getPhrase("menu", ctx.from.id)) {
      ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
    }
    else {
      await ctx.reply("✅", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
      let users = await getAllUsers();
      if (users.length != 0){
        for(let i = 0; i < users.length; i++){
          if (!ctx.message.caption)
            await bot.telegram.sendPhoto(users[i].userId, ctx.message.photo[0].file_id)
          else
            await bot.telegram.sendPhoto(users[i].userId, ctx.message.photo[0].file_id, {caption: ctx.message.caption})
        }
      }
      else
        ctx.reply("В БАЗЕ ДАННЫХ НЕТ ПОЛЬЗОВАТЕЛЕЙ")
    }
  }
})



/* --BOT SCENE HANDLERS SECTION-- */

// -admin handler-
async function admin_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("sendNews", ctx.from.id)) {
    await ctx.replyWithPhrase("newsDescr", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'sendnews');
  }
  else if(ctx.message.text == await getPhrase("makeTest", ctx.from.id))
    ctx.reply("Не готово")
  else if(ctx.message.text == await getPhrase("deleteTest", ctx.from.id))
    ctx.reply("Не готово")
  else if(ctx.message.text == await getPhrase("menu", ctx.from.id)){
    await ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else    
    ctx.replyWithPhrase("useButtons")
}

async function news_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else { //Text handler
    await ctx.reply("✅", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    let users = await getAllUsers();
    if (users.length != 0){
      for(let i = 0; i < users.length; i++){
          await bot.telegram.sendMessage(users[i].userId, ctx.message.text)
      }
    }
  }
}

async function reply_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if(ctx.message.text == await getPhrase("menu", ctx.from.id)){
    await ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    reply_person = "";
  }
  else {
    if(reply_person == "")
      ctx.reply("ПОТЕРЯНО: КОМУ ОТПРАВЛЯТЬ ОТВЕТ", await menuKeyboard(ctx.from.id))
    else {
      await ctx.reply("✅", await menuKeyboard(ctx.from.id))
      await bot.telegram.sendMessage(reply_person, "✉️✉️✉️\n"+ctx.message.text+"\n✉️✉️✉️");
      reply_person = "";
    }
    user_states.set(ctx.from.id, 'menu');
  }
}


// -menu handler-
async function menu_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 

  //contact SCENARIO
  if (ctx.message.text == await getPhrase("contact", ctx.from.id)) {
    await ctx.replyWithPhrase("contactDescr", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'contact');
  }


  //quiz SCENARIO
  else if (ctx.message.text == await getPhrase("takeTest", ctx.from.id)) {
    await ctx.reply("↴", await returnKeyboard(ctx.from.id))
    ctx.reply("What creature can fly?", //line continues below
      Markup.inlineKeyboard([CLB("Cat"), CLB("Fish"), CLB("Bird"), CLB("Snake")]));
    user_states.set(ctx.from.id, 'quiz'); //Go to second_handler
  }

  //MY LVL SCENARIO
  else if (ctx.message.text == await getPhrase("mylvl", ctx.from.id)) {
    let searchResult = await getBotUserByUserId(ctx.from.id)
    if (searchResult === undefined) {
      ctx.reply("No user found")
    }
    else {
      await ctx.replyWithExperience(searchResult.exp)
      if (ctx.from.id.toString() == (process.env.ADMIN_ID as string)){
        await ctx.replyWithPhrase("admin", await adminKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, 'admin');
      }
    }
  }
  
  else {
    ctx.reply(await getPhrase("useButtons", ctx.from.id), await menuKeyboard(ctx.from.id));
  }
}

// -setup callback handler-
async function setup_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if ((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == "🇷🇺" || "🇺🇸" || "🇺🇦") {
    await createBotUser({
      userId: ctx.from.id,
      language: (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data as "ru" || "en" || "ua",
      exp: 10
    });
    ctx.deleteMessage()
    ctx.replyWithPhrase("userCreated", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu')
  }
  else
    ctx.reply("Something went wrong when creating a user")
}


async function contact_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else { //Text handler
    await ctx.replyWithPhrase("thankyou", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    await bot.telegram.sendMessage(process.env.ADMIN_ID as string, "✉️✉️✉️\n➡️\""+ctx.from.username+"\" "
    +ctx.from.first_name+" "+ctx.from.last_name+":↴\n"+ctx.message.text+"\n✉️✉️✉️",
    Markup.inlineKeyboard([Markup.button.callback(await getPhrase('doReply', ctx.from.id), ctx.from.id.toString())]) )
  }
}


// -test2 question scene-
async function quiz_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
    ctx.replyWithPhrase("useButtons", await menuKeyboard(ctx.from.id))
}

async function quiz_callback_handler(ctx: CustomContext) {
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