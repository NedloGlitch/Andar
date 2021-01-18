import { Markup, Telegraf } from 'telegraf';
import { config } from 'dotenv';
import { CallbackQuery, ExtraReplyMessage, Message, User as TelegramUser } from 'telegraf/typings/telegram-types';
import { Context } from 'telegraf/typings/context';

config();


let UsersExp: Array<
{user: number;
exp: number;}
> = [{user:1, exp:1}];


type State = 'menu' | 'first' | 'second';
// key: chatId, value: State
const user_states = new Map<number, State>();

const bot = new Telegraf(process.env.BOT_TOKEN as string); // Creates bot

function createKeyboard(answers: string[]): ExtraReplyMessage {
    return Markup.keyboard(answers);
}
  
const keyboard_menu = createKeyboard(['Test Text Question', 'Test Choice Question', 'My Level' ]);
const return_menu = createKeyboard(['Menu']);

function userSearch(nameKey:number){
  for (var i=0; i < UsersExp.length; i++) {
      if (UsersExp[i].user == nameKey) {
          return i;
      }
      else
        return false;
  }
}

bot.start( async (ctx) => { 
    ctx.reply('Well hello there!\n', keyboard_menu);
    if(userSearch((ctx.from as TelegramUser).id) === false){
      UsersExp.push({user:((ctx.from as TelegramUser).id), exp:0})
      console.log("created user data")
    }
    else if (userSearch((ctx.from as TelegramUser).id) === undefined)
      console.log("undefined happen")
})

bot.hears('Test Text Question', async (ctx) =>{
    ctx.reply("Say My Name", return_menu)
    user_states.set((ctx.message).chat.id, 'first'); //Go to first_handler
})

bot.hears('Test Choice Question', async (ctx) =>{
  await ctx.reply("Ok, hard one right here ↴", return_menu)
  bot.telegram.sendMessage(ctx.message.chat.id, "What creature can fly?", Markup.inlineKeyboard([ CLB("Cat"), CLB("Fish"), CLB("Bird"), CLB("Snake")]));
  user_states.set((ctx.message).chat.id, 'second'); //Go to second_handler
})

bot.hears('My Level', async (ctx) =>{ 
  let curExp = 0;
  let searchResult = userSearch((ctx.from as TelegramUser).id)
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
  let expLine = ""
  for(i=0; i<curExp%10; i++)
    expLine = expLine + " █";
  for(i=curExp%10; i<10; i++)
    expLine = expLine + " -";
  ctx.reply("Here\'s you level!\nLv." + ((curExp/10) - 0.5).toFixed(0) + "[" + expLine + " ] " + curExp%10 + "/10 exp");
})

bot.on('text', async (ctx) => {
    const telegram_user = ctx.from as TelegramUser;
    const user_state = user_states.get(telegram_user.id);
    switch (user_state) {
      case undefined:
        user_states.set(telegram_user.id, 'menu');
        ctx.reply('Returning to menu', keyboard_menu);
        break;
      case 'first':
        await test_question_handler(ctx);
        break;
      case 'second':
        await test_choice_handler(ctx);
        break;
      case 'menu':
        ctx.reply('Please use buttons in menu', keyboard_menu);
        break;
      default:
        break;
    }
  })

bot.launch();

bot.on('callback_query', async (ctx) => {
  const telegram_user = ctx.from as TelegramUser
  if(user_states.get(telegram_user.id) == "second")
  {
    const answer = "Bird"
    if((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == answer) {
      ctx.deleteMessage(ctx.message)
      ctx.reply('https://i.redd.it/houw2o6e6ro21.jpg', keyboard_menu)

      for (var i=0; i < UsersExp.length; i++) {
        if (UsersExp[i].user === (ctx.from as TelegramUser).id) {
          UsersExp[i].exp++;
          console.log("succecfully found user exp")}
        }

      user_states.set((telegram_user).id, 'menu'); //Go to second_handler
    }
    else {
      ctx.deleteMessage(ctx.message)
      ctx.reply("You answered wrong. \nBack to Menu" , keyboard_menu)
      user_states.set((telegram_user).id, 'menu'); //Go to second_handler
    }
  }
})

async function test_question_handler(ctx: Context & { message: Message.TextMessage }) {
  if(ctx.message.text == "Menu"){
    ctx.reply("Ok, back in main menu!", keyboard_menu) 
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

async function test_choice_handler(ctx: Context & { message: Message.TextMessage }) {
  if(ctx.message.text == "Menu"){
    ctx.reply("Ok, back in main menu!", keyboard_menu) 
    user_states.set(ctx.message.chat.id, 'menu');
  }
  else
    ctx.reply('Use buttons under the text');
}

function CLB(name:string){ //CallBack button fast creation
  return Markup.button.callback(name, name)
}