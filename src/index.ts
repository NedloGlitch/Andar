import { Markup, Telegraf } from 'telegraf'; //Telegraf and Keyboard Markup
import { config } from 'dotenv'; //BOT_TOKEN safe storing
import { CallbackQuery, ExtraReplyMessage, Message, User } 
from 'telegraf/typings/telegram-types';
//import { Context } from 'telegraf/typings/context'; //Telegraf Context

//import { Users } from './entity/Users';
//import { Questions } from './entity/Questions';

import { createBotUser, getBotUserByUserId, addUserEXP } from './database';
import { getPhrase, Phrase } from './i18n';
import type CustomContext from './CustomContext';

//I do comments very bad.  Be prepared.

config(); //DOTENV .env file load function



/*  ---TELEGRAF SECTION--- */
//Telegraf State system setup
type State = 'menu' | 'setup' | 'first' | 'second';
const user_states = new Map<number, State>(); // TEMPLATE FOR STATE SET\GET: key: chatId, value: State

//Telegraf Keyboards setup
function createKeyboard(answers: string[]): ExtraReplyMessage {
    return Markup.keyboard(answers);
}

async function keyboard_menu(userId:number){
  return createKeyboard(
    [ await getPhrase("anket", userId),
      await getPhrase("takeTest", userId),
      await getPhrase("mylvl", userId) ]
    );
  }

async function return_menu(userId:number){ return createKeyboard([ await getPhrase("menu", userId) ]);  }

  //async function admin_menu(userId:number){ return createKeyboard([ await getPhrase("admin", userId) ]);  }

//Telegraf bot creation
const bot = new Telegraf<CustomContext>(process.env.BOT_TOKEN as string); // Creates bot
bot.launch(); // Launches bot

bot.use((ctx, next) => {
  ctx.replyWithPhrase = async (phrase: Phrase, extra?: ExtraReplyMessage) => {
    return await ctx.reply(await getPhrase(phrase, (ctx.from as User).id), extra);
  } 
  ctx.replyWithExperience = async (currentExperience:number) => {
    let curExp = currentExperience
      let expLine = ""
      for(var i=0; i<curExp%10; i++)    expLine = expLine + " █";
      for(i=curExp%10; i<10; i++)       expLine = expLine + " -";
    return await ctx.reply(await getPhrase("lvl", (ctx.from as User).id)
    + ((curExp/10) - 0.5).toFixed(0) + " [" + expLine + " ] " + curExp%10 + "/10");
  }
  next();
});

//Bot action on /start command
bot.start( async (ctx) => { 
  if (!ctx.from) return;
  ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇸")]))
  user_states.set(ctx.from.id, 'setup')
})



/* --BOT ON SECTION-- */

bot.on('text', async (ctx) => {
  if (!ctx.from) return;
    if(await getBotUserByUserId(ctx.from.id) == undefined){      //NO USER IN DATABASE CHECK
      ctx.reply("Looks like you aren't registered in database, we will start over", Markup.removeKeyboard())
      ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇸")]))
      user_states.set(ctx.from.id, 'setup')
    }
    else {
      const user_state = user_states.get(ctx.from.id);
      switch (user_state) {
        case 'setup':
          //await setup_handler(ctx);
        case 'first':
          await test_question_handler(ctx);
          break;
        case 'second':
          await test_choice_handler(ctx);
          break;
        case 'menu':
          await menu_handler(ctx);
          break;
        default:
          ctx.replyWithPhrase('back', await keyboard_menu(ctx.from.id));
          user_states.set(ctx.from.id, 'menu');
          break;
      }
    }
  })












/* --BOT CALLBACK HANDLER SECTION-- */
bot.on('callback_query', async (ctx) => {
  if (!ctx.from) return;
  switch(user_states.get(ctx.from.id)){


  //CASE SETUP
    case "setup":
      if((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == "🇷🇺" || "🇺🇸"){
        await createBotUser({
          userId: ctx.from.id,
          news: true,
          language: (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data as "ru"||"en",
          exp:10
        });
        ctx.deleteMessage(ctx.message)
        ctx.replyWithPhrase("userCreated", await keyboard_menu(ctx.from.id))
        user_states.set(ctx.from.id, 'menu')
      }
      else
        ctx.reply("Something went wrong when creating a user")
      break;


  //CASE SECOND
    case "second":
      const answer = "Bird"
      if((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == answer) { //waiting for answer(callback)
        ctx.deleteMessage(ctx.message)
        ctx.reply('https://i.redd.it/houw2o6e6ro21.jpg', await keyboard_menu(ctx.from.id))
        await addUserEXP(ctx.from.id, 2);
        user_states.set(ctx.from.id, 'menu'); //Go to menu
      }
      else {
        ctx.deleteMessage(ctx.message)
        ctx.reply("You answered wrong. \nBack to Menu" , await keyboard_menu(ctx.from.id))
        user_states.set(ctx.from.id, 'menu'); //Go to menu
      }
      break;


  //DEFAULT
    default:
      ctx.reply("Something went wrong. We will start over" , Markup.removeKeyboard())
      ctx.reply("👋", Markup.inlineKeyboard([CLB("🇷🇺"), CLB("🇺🇸")]))
      user_states.set(ctx.from.id, 'setup')
      break;
  }
})






/* --BOT SCENE HANDLERS SECTION-- */ 

// -menu handler-
async function menu_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return;

  //ANKET SCENARIO
  if(ctx.message.text == await getPhrase("anket", ctx.from.id)){
    ctx.replyWithPhrase("anketDescr", await return_menu(ctx.from.id)) 
    user_states.set(ctx.from.id, 'first');
  }


  //TEST SCENARIO
  else if(ctx.message.text == await getPhrase("takeTest", ctx.from.id)){
    await ctx.reply("↴", await return_menu(ctx.from.id))
    ctx.reply("What creature can fly?", //line continues below
    Markup.inlineKeyboard([ CLB("Cat"), CLB("Fish"), CLB("Bird"), CLB("Snake")]));
    user_states.set(ctx.from.id, 'second'); //Go to second_handler
  }

  //MY LVL SCENARIO
  else if(ctx.message.text == await getPhrase("mylvl", ctx.from.id)){
    let searchResult = await getBotUserByUserId(ctx.from.id)
    if(searchResult === undefined){
      ctx.reply("No user found")
    }
    else {
      ctx.replyWithExperience(searchResult.exp)
    }
  }
  else {
    ctx.reply(await getPhrase("useButtons", ctx.from.id), await keyboard_menu(ctx.from.id));
  }
}






// -test1 question scene- 
async function test_question_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return;
  if(ctx.message.text == await getPhrase("menu", ctx.from.id)){
    ctx.replyWithPhrase("back", await keyboard_menu(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else if(ctx.message.text == "Andar"){
    ctx.reply("Ye, you right!\n(Go back in menu or try again)")
    await addUserEXP(ctx.from.id, 1);
  }

  else {
    ctx.reply("Try again.")
  }
}

// -test2 question scene-
async function test_choice_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return;
  if(ctx.message.text == await getPhrase("menu", ctx.from.id)){
    ctx.replyWithPhrase("back", await keyboard_menu(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
  ctx.replyWithPhrase("useButtons", await keyboard_menu(ctx.from.id))
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

function CLB(name:string){ //CallBack button fast creation
  return Markup.button.callback(name, name)
}
/*
import {tempStorage} from './cache'

(global as any).getMap = () => {
  console.log(tempStorage)
}
*/