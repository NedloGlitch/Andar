import { Markup, Telegraf } from 'telegraf'; //Telegraf and Keyboard Markup
import { config } from 'dotenv'; //BOT_TOKEN safe storing
import { CallbackQuery, ExtraReplyMessage, Message, User as TelegramUser } 
from 'telegraf/typings/telegram-types';
import { Context } from 'telegraf/typings/context'; //Telegraf Context
import { Connection, createConnection, Repository } from "typeorm"; //Database Control
import { Users } from './entity/Users';

import { localization as loc } from '../src/localization' //localization file

//I do comments very bad.  Be prepared.

config(); //DOTENV .env file load function


//temp
let UsersExp: Array<
{user: number;
exp: number;}
> = [{user:1, exp:1}];
//end temp

/*  ---TELEGRAF SECTION--- */
//Telegraf State system setup
type State = 'menu' | 'first' | 'second';
const user_states = new Map<number, State>(); // TEMPLATE FOR STATE SET\GET: key: chatId, value: State

//Telegraf Keyboards setup
function createKeyboard(answers: string[]): ExtraReplyMessage {
    return Markup.keyboard(answers);
}
const keyboard_menu = createKeyboard([loc.e.anket, loc.e.takeTest, loc.e.mylvl ]);
const return_menu = createKeyboard([loc.e.menu]);
const admin_menu = createKeyboard(['Admin Mode']);

//Telegraf bot creation
const bot = new Telegraf(process.env.BOT_TOKEN as string); // Creates bot
bot.launch(); // Launches bot

//Bot action on /start command
bot.start( async (ctx) => { 
    ctx.reply(loc.e.start, keyboard_menu);
    if(userSearch((ctx.from as TelegramUser).id) === false){
      UsersExp.push({user:((ctx.from as TelegramUser).id), exp:10})
      console.log("created user data")
    }
    else if (userSearch((ctx.from as TelegramUser).id) === undefined)
      console.log("undefined happen")
})

/* --BOT HEARS Section-- */
bot.hears(loc.e.anket, async (ctx) =>{
    ctx.reply("Say My Name", return_menu)
    user_states.set((ctx.message).chat.id, 'first'); //Go to first_handler
})

bot.hears(loc.e.takeTest, async (ctx) =>{
  await ctx.reply("↴", return_menu)
  bot.telegram.sendMessage(ctx.message.chat.id, "What creature can fly?", //line continues below
  Markup.inlineKeyboard([ CLB("Cat"), CLB("Fish"), CLB("Bird"), CLB("Snake")]));
  
  user_states.set((ctx.message).chat.id, 'second'); //Go to second_handler
})

bot.hears(loc.e.mylvl, async (ctx) =>{ 
  let curExp = 0;
  let searchResult = userSearch((ctx.from as TelegramUser).id)
  //temp section
  if(searchResult === false){
    //UsersExp.push({user:((ctx.from as TelegramUser).id), exp:0})
    //console.log("created user data")
  }
  else if (searchResult === undefined){
      console.log("undefined happen")
  }
  else {
      curExp = UsersExp[searchResult].exp;
  } 

  for (var i=0; i < UsersExp.length; i++) {
    if (UsersExp[i].user === (ctx.from as TelegramUser).id) {
      curExp = UsersExp[i].exp;
      console.log("succecfully found user exp")}
    }
  //end temp section
  let expLine = ""
  for(i=0; i<curExp%10; i++)
    expLine = expLine + " █";
  for(i=curExp%10; i<10; i++)
    expLine = expLine + " -";
  ctx.reply(loc.e.lvl
   + ((curExp/10) - 0.5).toFixed(0) + "[" + expLine + " ] " + curExp%10 + "/10");
})


/* --BOT ON SECTION-- */

bot.on('text', async (ctx) => {
    const telegram_user = ctx.from as TelegramUser;
    const user_state = user_states.get(telegram_user.id);
    switch (user_state) {
      case undefined:
        user_states.set(telegram_user.id, 'menu');
        ctx.reply(loc.e.back, keyboard_menu);
        break;
      case 'first':
        await test_question_handler(ctx);
        break;
      case 'second':
        await test_choice_handler(ctx);
        break;
      case 'menu':
        ctx.reply(loc.e.useButtons, keyboard_menu);
        break;
      default:
        break;
    }
  })

/* --BOT CALLBACK HANDLER SECTION-- */
bot.on('callback_query', async (ctx) => {
  const telegram_user = ctx.from as TelegramUser
  if(user_states.get(telegram_user.id) == "second") //stage set
  {
    const answer = "Bird"
    if((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == answer) { //waiting for answer(callback)
      ctx.deleteMessage(ctx.message)
      ctx.reply('https://i.redd.it/houw2o6e6ro21.jpg', keyboard_menu)
//temp section
      for (var i=0; i < UsersExp.length; i++) {
        if (UsersExp[i].user === (ctx.from as TelegramUser).id) {
          UsersExp[i].exp++;
          console.log("succecfully found user exp")}
        }
//end temp section
      user_states.set((telegram_user).id, 'menu'); //Go to menu
    }
    else {
      ctx.deleteMessage(ctx.message)
      ctx.reply("You answered wrong. \nBack to Menu" , keyboard_menu)
      user_states.set((telegram_user).id, 'menu'); //Go to menu
    }
  }
})

/* --BOT SCENE HANDLERS SECTION-- */ 
// -test1 question scene- 
async function test_question_handler(ctx: Context & { message: Message.TextMessage }) {
  if(ctx.message.text == loc.e.menu){
    ctx.reply(loc.e.back, keyboard_menu) 
    user_states.set(ctx.message.chat.id, 'menu');
  }
  else if(ctx.message.text == "Andar"){
    ctx.reply("Ye, you right!")

    for (var i=0; i < UsersExp.length; i++) {
      if (UsersExp[i].user === (ctx.from as TelegramUser).id) {
        UsersExp[i].exp++;
        console.log("succecfully found user exp")}
      }
  }

  else {
    ctx.reply("Nah, not quite.")
  }
}

// -test2 question scene-
async function test_choice_handler(ctx: Context & { message: Message.TextMessage }) {
  if(ctx.message.text == loc.e.menu){
    ctx.reply(loc.e.back, keyboard_menu) 
    user_states.set(ctx.message.chat.id, 'menu');
  }
  else
    ctx.reply(loc.e.useButtons);
}




/* ---Quality of life functions--- */

function CLB(name:string){ //CallBack button fast creation
  return Markup.button.callback(name, name)
}

function userSearch(nameKey:number){
  for (var i=0; i < UsersExp.length; i++) {
      if (UsersExp[i].user == nameKey) {
          return i;
      }
  }
  return false;
}
