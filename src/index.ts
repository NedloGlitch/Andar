import { Markup, Telegraf } from 'telegraf'; //Telegraf and Keyboard Markup
import { config } from 'dotenv'; //BOT_TOKEN safe storing
import { CallbackQuery, ExtraReplyMessage, Message, User } from 'telegraf/typings/telegram-types';
import { createBotUser, getBotUserByUserId, addUserEXP, getAllUsers, getAllQuizs, getBotUserExp, createQuestion, deleteQuiz, getCertainQuiz, deleteQuestion, getCertainHeader } from './database';
import { getPhrase, getUserLocale, Phrase } from './i18n'; //Locale provider
import { addKeyboard, adminKeyboard, answerKeyboard, denyKeyboard, languageKeyboard, menuKeyboard, returnKeyboard } from './keyboards'
import type CustomContext from './CustomContext';
import { setStoredString, getStoredString, emptyStoredString, setStoredQuestion, getAllQuestionStored, emptyStoredQuestion } from './cache';

config(); //DOTENV .env file load function

//Telegraf State system setup
type State = 'menu' | 'setup' | 'contact' | 'selectquiz' | 'quiz' | 'admin' | 'sendnews' | 'reply' |
  'makequiz' | 'makequestion' | 'editquiz' | 'editdescr' | 'editquestion' | 'editing' | 'rename' | 'deletequiz';
const user_states = new Map<number, State>(); // TEMPLATE FOR STATE SET\GET: key: chatId, value: State
let reply_person: string

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

  ctx.replyWithQuizListItem = async (header: string, description: string) => {
    return await ctx.replyWithMarkdown("📋➡️*" + header + "*" + "\n📄" + description,
      Markup.inlineKeyboard([Markup.button.callback(await getPhrase("startQuiz", (ctx.from as User).id), header)]))
  }

  ctx.replyWithQuestion = async (position: number) => {
    let questions = getAllQuestionStored((ctx.from as User).id)
    if (questions[position + questions.length / 3] == "-No Answers-")
      return await ctx.reply(await getPhrase("questionNumber", (ctx.from as User).id) + position + 1 + "\n" + questions[position])
    else {
      return await ctx.reply(await getPhrase("questionNumber", (ctx.from as User).id) + position + 1 + "\n" + questions[position] + "\n BUT IT GOT ANSWERS")
    }
  }
  next();
});

//Bot action on /start command
bot.start(async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  ctx.reply("👋", Markup.inlineKeyboard([[CLB("🇷🇺\nРусский")], [CLB("🇺🇦\nУкраїнська")]]))
  user_states.set(ctx.from.id, 'setup')
})

/* --BOT ON TEXT SECTION-- */
//set's special handlers for scenes
bot.on('text', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (await getBotUserByUserId(ctx.from.id) == undefined) {      //NO USER IN DATABASE CHECK
    await ctx.reply("❌ Looks like you aren't registered in database, we will start over", Markup.removeKeyboard())
    await ctx.reply("👋", Markup.inlineKeyboard([[CLB("🇷🇺\nРусский")], [CLB("🇺🇦\nУкраїнська")]]))
    user_states.set(ctx.from.id, 'setup')
  }
  else {
    const user_state = user_states.get(ctx.from.id);
    switch (user_state) {
      case 'setup': //setup has no text commands
        break;
      case 'contact':
        await contact_handler(ctx);
        break;
      case 'selectquiz':
        await select_quiz_handler(ctx);
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
      case 'makequiz':
        await make_quiz_handler(ctx);
        break;
      case 'makequestion':
        await make_question_handler(ctx);
        break;
      case 'editquiz':
        await edit_quiz_handler(ctx);
        break;
      case 'editquestion':
        await edit_question_handler(ctx);
        break;
      case 'editing':
        await editing_handler(ctx);
        break;
      case 'editdescr':
        await edit_description_handler(ctx);
        break;
      case 'rename':
        await rename_handler(ctx);
        break;
      case 'deletequiz':
        await select_quiz_handler(ctx);
        break;
      default:
        emptyStoredString(ctx.from.id)
        emptyStoredQuestion(ctx.from.id)
        await ctx.replyWithPhrase("afterRestart")
        await ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
        user_states.set(ctx.from.id, 'menu');
        if (ctx.from.id.toString() == process.env.ADMIN_ID as string) {
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
      case 'setup':
        await setup_callback_handler(ctx)
        break;
      case 'selectquiz':
        await select_quiz_callback_handler(ctx)
        break;
      case 'editquiz':
        await edit_quiz_callback_handler(ctx)
        break;
      case 'editquestion':
        await edit_question_callback_handler(ctx)
        break;
      case 'deletequiz':
        await delete_quiz_callback_handler(ctx)
        break;
      //DEFAULT
      default:
        emptyStoredString(ctx.from.id)
        emptyStoredQuestion(ctx.from.id)
        if (ctx.from.id.toString() == process.env.ADMIN_ID as string) {
          ctx.replyWithPhrase("replyMessage", await returnKeyboard(ctx.from.id))
          user_states.set(ctx.from.id, 'reply');
          reply_person = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data
          ctx.editMessageText((ctx.callbackQuery.message as Message.TextMessage).text + "\n" + await getPhrase("replyDone", ctx.from.id));
        }
        else {
          await ctx.replyWithPhrase("badButton", Markup.removeKeyboard())
          ctx.deleteMessage()
          ctx.replyWithPhrase('back', await menuKeyboard(ctx.from.id));
          user_states.set(ctx.from.id, 'menu');
        }
        break;
    }
})

//NEWS PHOTO HANDLER
bot.on('photo', async (ctx) => {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (user_states.get(ctx.from.id) == "sendnews") {
    if (ctx.message.caption == await getPhrase("menu", ctx.from.id)) {
      ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
    }
    else {
      await ctx.reply("✅", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
      let users = await getAllUsers();
      if (users.length != 0) {
        for (let i = 0; i < users.length; i++) {
          if (!ctx.message.caption)
            await bot.telegram.sendPhoto(users[i].userId, ctx.message.photo[0].file_id)
          else
            await bot.telegram.sendPhoto(users[i].userId, ctx.message.photo[0].file_id, { caption: ctx.message.caption })
        }
      }
      else
        ctx.reply("В БАЗЕ ДАННЫХ НЕТ ПОЛЬЗОВАТЕЛЕЙ")
    }
  }
})

/* --BOT SCENE HANDLERS SECTION-- */
// -text handlers section-
async function admin_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("sendNews", ctx.from.id)) {
    await ctx.replyWithPhrase("newsDescr", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'sendnews');
  }
  else if (ctx.message.text == await getPhrase("makeTest", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("testName", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'makequiz')
  }
  else if (ctx.message.text == await getPhrase("editTest", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    quiz_select_function(ctx);
    user_states.set(ctx.from.id, 'editquiz')
  }
  else if (ctx.message.text == await getPhrase("deleteTest", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    quiz_select_function(ctx);
    user_states.set(ctx.from.id, 'deletequiz')
  }
  else if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    await ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
    ctx.replyWithPhrase("useButtons")
}

async function menu_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  //contact SCENARIO
  //TEMP FUNCTION 
  emptyStoredString(ctx.from.id)
  emptyStoredQuestion(ctx.from.id)
  //END OF TEMP FUNCTION
  if (ctx.message.text == await getPhrase("contact", ctx.from.id)) {
    await ctx.replyWithPhrase("contactDescr", await returnKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'contact');
  }
  //select quiz SCENARIO
  else if (ctx.message.text == await getPhrase("takeTest", ctx.from.id)) {
    //emptyStoredString(ctx.from.id);
    quiz_select_function(ctx);
    user_states.set(ctx.from.id, 'selectquiz'); //Go to second_handler
  }

  //MY LVL SCENARIO
  else if (ctx.message.text == await getPhrase("mylvl", ctx.from.id)) {
    await ctx.replyWithExperience(await getBotUserExp(ctx.from.id))
    if (ctx.from.id.toString() == (process.env.ADMIN_ID as string)) {
      await ctx.replyWithPhrase("admin", await adminKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'admin');
    }
  }

  else {
    await returnKeyboard(ctx.from.id);
    ctx.reply(await getPhrase("useButtons", ctx.from.id), await menuKeyboard(ctx.from.id));
  }
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
    if (users.length != 0) {
      for (let i = 0; i < users.length; i++) {
        await bot.telegram.sendMessage(users[i].userId, ctx.message.text, { parse_mode: 'Markdown' })
      }
    }
  }
}

async function reply_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    await ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
    reply_person = "";
  }
  else {
    if (reply_person == "")
      ctx.reply("ПОТЕРЯНО: КОМУ ОТПРАВЛЯТЬ ОТВЕТ", await menuKeyboard(ctx.from.id))
    else {
      await ctx.reply("✅", await menuKeyboard(ctx.from.id))
      await bot.telegram.sendMessage(reply_person, "✉️✉️✉️\n💼 \"Перший Європейський\" ↴\n" + ctx.message.text + "\n✉️✉️✉️");
      reply_person = "";
    }
    user_states.set(ctx.from.id, 'menu');
  }
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
    await bot.telegram.sendMessage(process.env.ADMIN_ID as string, "✉️✉️✉️\n👤\"" + ctx.from.username + "\" "
      + ctx.from.first_name + " " + ctx.from.last_name + ":↴\n" + ctx.message.text + "\n✉️✉️✉️",
      Markup.inlineKeyboard([Markup.button.callback(await getPhrase('doReply', ctx.from.id), ctx.from.id.toString())]))
  }
}

async function select_quiz_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    let stored = getStoredString(ctx.from.id)
    if (stored)
      for (let i = 0; i < stored.length; i++) {
        await ctx.deleteMessage(+stored[i]) //+ is converting string to number
      }
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
    ctx.replyWithPhrase("useButtons", await returnKeyboard(ctx.from.id))
}

async function quiz_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    setStoredString(ctx.from.id, ctx.message.text)
    let stored = getStoredString(ctx.from.id)
    if (!stored) { //no stored string
      console.log("Bad stuff happen, no stored string")
    }
    else {
      let questions = getAllQuestionStored(ctx.from.id)
      if (stored.length < questions.length / 3) {
        if (questions[stored.length + questions.length / 3] == "-No Answers-")
          return await ctx.reply(await getPhrase("questionNumber", ctx.from.id) + (stored.length + 1)
            + "\n" + questions[stored.length], await returnKeyboard(ctx.from.id))
        else {
          return await ctx.reply(await getPhrase("questionNumber", ctx.from.id) + (stored.length + 1)
            + "\n" + questions[stored.length], await answerKeyboard(ctx.from.id, questions[stored.length + questions.length / 3]))
        }
      }
      else {
        await ctx.replyWithPhrase("endQuiz")
        let resultString = ""
        let score: number = 0;
        for (let i = 0; i < stored.length; i++) {
          if (stored[i] == questions[i + (questions.length / 3) * 2]) {
            resultString = resultString + "\n\n" + await getPhrase("questionNumber", ctx.from.id) + (i + 1)
              + "\n" + questions[i] + "\n✅ " + stored[i]
            await addUserEXP(ctx.from.id, 1);
            score++;
          }
          else {
            resultString = resultString + "\n\n" + await getPhrase("questionNumber", ctx.from.id) + (i + 1)
              + "\n" + questions[i] + "\n❌ _" + stored[i] + "_\n➡️ " + questions[(questions.length / 3) * 2 + i]
          }
        }
        resultString = resultString + "\n\n*" + score + " / " + stored.length + "*"
        await ctx.replyWithMarkdown(resultString)
        //emptyStoredString(ctx.from.id)
        //emptyStoredQuestion(ctx.from.id)
        ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, 'menu');
      }
    }
  }
}

async function make_quiz_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    let stored = getStoredString(ctx.from.id)
    if (!stored)
      ctx.reply("Что-то пошло не так")
    else if (stored.length == 0 || stored == []) {
      setStoredString(ctx.from.id, ctx.message.text)
      ctx.replyWithPhrase("testDescription")
    }
    else if (stored.length == 1) {
      setStoredString(ctx.from.id, ctx.message.text)
      ctx.replyWithPhrase("testLvl", await denyKeyboard(ctx.from.id))
    }
    else if (stored.length == 2) {
      if (ctx.message.text == await getPhrase("noLimit", ctx.from.id))
        setStoredString(ctx.from.id, "0")
      else
        setStoredString(ctx.from.id, ctx.message.text)
      ctx.replyWithPhrase("testLanguage", await languageKeyboard(ctx.from.id))
    }
    else {
      let temp: string = "";
      if (ctx.message.text == "Русский")
        temp = "ru"
      else if (ctx.message.text == "Українська")
        temp = "ua"
      //let question:Omit<Questions, "id">
      let stored = getStoredString(ctx.from.id)
      if (!stored || stored.length < 3)
        ctx.reply("String lost, not enough data")
      else {
        await createQuestion({
          id: 0,
          header: stored[0],
          description: stored[1],
          answer: (parseInt(stored[2]) * 10).toString() + temp,
          correctAnswer: "-header-"
        })
        await ctx.replyWithPhrase("testMade")
        user_states.set(ctx.from.id, 'makequestion')
        await ctx.replyWithPhrase("questionName", await returnKeyboard(ctx.from.id))
        emptyStoredString(ctx.from.id)
        setStoredString(ctx.from.id, stored[0])
      }
    }
  }
}

async function make_question_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    let stored = getStoredString(ctx.from.id)
    if (!stored || stored.length == 0)
      ctx.reply("String lost, not enough data")
    else {
      if (stored.length == 1) {
        ctx.replyWithPhrase("questionAnswers", await denyKeyboard(ctx.from.id))
        setStoredString(ctx.from.id, ctx.message.text)
      }
      else if (stored.length == 2) {
        ctx.replyWithPhrase("questionCorrectAnswer", await returnKeyboard(ctx.from.id))
        if (ctx.message.text == await getPhrase("noLimit", ctx.from.id))
          setStoredString(ctx.from.id, "-No Answers-")
        else
          setStoredString(ctx.from.id, ctx.message.text)
      }
      else if (stored.length == 3) {
        const answer = (temp: string): string | null => { //Answer conversion
          if (temp == "-No Answers-") return null
          else return temp;
        }
        await createQuestion({
          id: 0,
          header: stored[0],
          description: stored[1],
          answer: answer(stored[2]),
          correctAnswer: ctx.message.text
        })
        await ctx.replyWithPhrase("questionMade", await returnKeyboard(ctx.from.id))
        emptyStoredString(ctx.from.id)
        setStoredString(ctx.from.id, stored[0])
      }
    }
  }
}

async function edit_quiz_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("edit quiz bad stuff");
  else {
    for (let i = 0; i < stored.length; i++)
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu')
  }
}

async function edit_question_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("edit question bad stuff");
  else {
    for (let i = 1; i < stored.length; i++)
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number

    if (ctx.message.text == await getPhrase("addQuestion", ctx.from.id)) {

      let temp = stored[0]
      await ctx.replyWithPhrase("questionName", await returnKeyboard(ctx.from.id))
      emptyStoredString(ctx.from.id)
      setStoredString(ctx.from.id, temp)
      user_states.set(ctx.from.id, "makequestion")
    }
    else if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
      ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
    }
    else if (ctx.message.text == await getPhrase("newName", ctx.from.id)) {
      ctx.reply(await getPhrase("newName", ctx.from.id) + ": ", await returnKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'rename');
    }
    else if (ctx.message.text == await getPhrase("editBasis", ctx.from.id)) {
      emptyStoredString(ctx.from.id)
      let temp = await getCertainHeader(stored[0])
      if (!temp)
        ctx.reply("No quiz found, how we got here?..");
      else {
        setStoredString(ctx.from.id, temp.id.toString())
        setStoredString(ctx.from.id, temp.header)
        ctx.replyWithPhrase("testDescription", await returnKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, "editdescr")
      }
    }
  }
}

async function edit_description_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("edit description bad stuff");
  else {
    if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
      //emptyStoredString(ctx.from.id)
      //emptyStoredQuestion(ctx.from.id)
      ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, 'menu');
    }
    else {
      /*let stored = getStoredString(ctx.from.id)
      if (!stored)
        ctx.reply("Что-то пошло не так")*/
      if (stored.length == 2) {
        setStoredString(ctx.from.id, ctx.message.text)
        ctx.replyWithPhrase("testLvl", await denyKeyboard(ctx.from.id))
      }
      else if (stored.length == 3) {
        if (ctx.message.text == await getPhrase("noLimit", ctx.from.id))
          setStoredString(ctx.from.id, "0")
        else
          setStoredString(ctx.from.id, ctx.message.text)
        ctx.replyWithPhrase("testLanguage", await languageKeyboard(ctx.from.id))
      }
      else {
        let temp: string = "";
        if (ctx.message.text == "Русский")
          temp = "ru"
        else if (ctx.message.text == "Українська")
          temp = "ua"
        //let question:Omit<Questions, "id">
        let stored = getStoredString(ctx.from.id)
        if (!stored || stored.length < 4)
          ctx.reply("String lost, not enough data")
        else {
          await createQuestion({
            id: parseInt(stored[0]),
            header: stored[1],
            description: stored[2],
            answer: (parseInt(stored[3]) * 10).toString() + temp,
            correctAnswer: "-header-"
          })
          await ctx.reply("✅", await menuKeyboard(ctx.from.id))
          user_states.set(ctx.from.id, 'menu')
        }
      }
    }
  }
}

async function editing_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    let stored = getStoredString(ctx.from.id)
    if (!stored || stored.length == 0)
      ctx.reply("String lost, not enough data")
    else {
      if (stored.length == 2) {
        ctx.replyWithPhrase("questionAnswers", await denyKeyboard(ctx.from.id))
        setStoredString(ctx.from.id, ctx.message.text)
      }
      else if (stored.length == 3) {
        ctx.replyWithPhrase("questionCorrectAnswer", await returnKeyboard(ctx.from.id))
        if (ctx.message.text == await getPhrase("noLimit", ctx.from.id))
          setStoredString(ctx.from.id, "-No Answers-")
        else
          setStoredString(ctx.from.id, ctx.message.text)
      }
      else if (stored.length == 4) {
        const answer = (temp: string): string | null => { //Answer conversion
          if (temp == "-No Answers-") return null
          else return temp;
        }
        await createQuestion({
          id: parseInt(stored[0]),
          header: stored[1],
          description: stored[2],
          answer: answer(stored[3]),
          correctAnswer: ctx.message.text
        })
        await ctx.reply("✅", await menuKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, "menu")
      }
    }
  }
}

async function rename_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    //emptyStoredString(ctx.from.id)
    //emptyStoredQuestion(ctx.from.id)
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else {
    let stored = getStoredString(ctx.from.id)
    if (!stored || stored.length == 0)
      ctx.reply("String lost, not enough data")
    else {
      let quiz = await getCertainQuiz(stored[0])
      for(let i=0;i<quiz.length;i++){
        await createQuestion({
          id: quiz[i].id,
          header: ctx.message.text,
          description: quiz[i].description,
          answer: quiz[i].answer,
          correctAnswer: quiz[i].correctAnswer
        })
      }
      await ctx.reply("✅", await menuKeyboard(ctx.from.id))
      user_states.set(ctx.from.id, "menu")
    }
  }
}

// -callback handler section-
async function setup_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  if ((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == "🇷🇺\nРусский" || "🇺🇸" || "🇺🇦\nУкраїнська") {
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

async function select_quiz_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("Something went very wrong when selecting a quiz!");
  else
    for (let i = 0; i < stored.length; i++) {
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number
    }
  await ctx.reply(await getPhrase("chosenQuiz", ctx.from.id) + ": " + (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data, await returnKeyboard(ctx.from.id))
  await setStoredQuestion(ctx.from.id, (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data)
  user_states.set(ctx.from.id, 'quiz')
  emptyStoredString(ctx.from.id)
  let questions = getAllQuestionStored(ctx.from.id)
  if (questions.length == 0) {
    ctx.replyWithPhrase("noQuestions", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu')
    //emptyStoredQuestion(ctx.from.id)
  }
  else {
    if (questions[questions.length / 3] == "-No Answers-")
      return await ctx.reply(await getPhrase("questionNumber", ctx.from.id) + (1)
        + "\n" + questions[0], await returnKeyboard(ctx.from.id))
    else {
      return await ctx.reply(await getPhrase("questionNumber", ctx.from.id) + (1)
        + "\n" + questions[0], await answerKeyboard(ctx.from.id, questions[questions.length / 3]))
    }
  }
}

async function edit_quiz_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  let tempUserId = ctx.from.id;
  if (!stored) ctx.reply("Something went very wrong when selecting a quiz!");
  else
    for (let i = 0; i < stored.length; i++) {
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number
    }
  await ctx.reply("➡ " + (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data, await addKeyboard(ctx.from.id))
  emptyStoredString(ctx.from.id)
  let temp = await getCertainQuiz((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data)
  setStoredString(ctx.from.id, temp[0].header)
  await ctx.reply("📝 " + await getPhrase("description", ctx.from.id) + ": " + temp[0].description)
  for (let i = 1; i < temp.length; i++) {
    await ctx.replyWithMarkdown("📄" + temp[i].description,
      Markup.inlineKeyboard([Markup.button.callback("❌", "❌" + temp[i].id), Markup.button.callback("☷", temp[i].id + "☷" + temp[i].header)]))
      .then((message) => { setStoredString(tempUserId, message.message_id.toString()) });
  }
  user_states.set(ctx.from.id, "editquestion")
}

async function edit_question_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("Something went very wrong when selecting a quiz!");
  else
    for (let i = 1; i < stored.length; i++) {
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number
    }
  let temp = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data
  if (temp.charAt(0) == "❌") {
    await deleteQuestion(parseInt(temp.slice(1)))
    await ctx.reply(await getPhrase("deleteTest", ctx.from.id) + " ➡ ID:" + parseInt(temp.slice(1)))
    await ctx.reply("✅", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, "menu")
  }
  else {
    emptyStoredString(ctx.from.id)
    let temp = (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data.split("☷")
    await ctx.reply(await getPhrase("editTest", ctx.from.id) + " 🔵 ID:" + temp[1])
    await ctx.replyWithPhrase("questionName", await returnKeyboard(ctx.from.id))
    setStoredString(ctx.from.id, temp[0])
    setStoredString(ctx.from.id, temp[1])
    user_states.set(ctx.from.id, "editing")
  }
}

async function delete_quiz_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from 
  let stored = getStoredString(ctx.from.id)
  if (!stored) ctx.reply("Something went very wrong when selecting a quiz!");
  else
    for (let i = 0; i < stored.length; i++) {
      await ctx.deleteMessage(+stored[i]) //+ is converting string to number
    }
  ctx.reply("➡ " + (ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data + await getPhrase("testDeleted", ctx.from.id))
  await deleteQuiz((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data)
  await ctx.reply("✅", await menuKeyboard(ctx.from.id))
  //emptyStoredString(ctx.from.id)
  user_states.set(ctx.from.id, "menu")
}


function CLB(name: string) { //CallBack button fast creation
  return Markup.button.callback(name, name)
}

async function quiz_select_function(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return;
  await ctx.replyWithPhrase("chooseQuiz", await returnKeyboard(ctx.from.id))
  //.then((message) => { setStoredString(tempUserId, message.message_id.toString()) });
  let quizs = await getAllQuizs();
  let tempUserId = ctx.from.id;
  for (let i = 0; i < quizs.length; i++) { //messy code 
    if (quizs[i].correctAnswer == "-header-") { //entry is main branch
      if (quizs[i].answer == null) { //No requirements
        await ctx.replyWithQuizListItem(quizs[i].header, quizs[i].description)
          .then((message) => { setStoredString(tempUserId, message.message_id.toString()) });
      }//store message ID to delete them later
      else { //there is some requirements
        let cleanText = (quizs[i].answer as string).replace(/[0-9]/g, '')
        let cleanNumber = parseInt((quizs[i].answer as string))
        if (cleanText == await getUserLocale(ctx.from.id) || !cleanText || ctx.from.id.toString() == process.env.ADMIN_ID as string) { // lanuage check
          if (cleanNumber <= await getBotUserExp(ctx.from.id) || ctx.from.id.toString() == process.env.ADMIN_ID as string) { // lvl check
            await ctx.replyWithQuizListItem(quizs[i].header, quizs[i].description)
              .then((message) => { setStoredString(tempUserId, message.message_id.toString()) });
          } //store message ID to delete them later
          else { // not enough lvl
            await ctx.replyWithMarkdown("📋➡️ *" + quizs[i].header + "*" + "\n📄 " + quizs[i].description
              + await getPhrase("lvlRequired", ctx.from.id) + ((cleanNumber / 10) - 0.5).toFixed(0))
              .then((message) => { setStoredString(tempUserId, message.message_id.toString()) });
          }
        }
      }
    }
  }
}

/*async function quiz_callback_handler(ctx: CustomContext) {
  if (!ctx.from) return; //exclude undefined in ctx.from
  const answer = "Птиця"
  if ((ctx.callbackQuery as CallbackQuery.DataCallbackQuery).data == answer) { //waiting for answer(callback)
    ctx.deleteMessage()
    ctx.reply('https://i.redd.it/houw2o6e6ro21.jpg', await menuKeyboard(ctx.from.id))
    await addUserEXP(ctx.from.id, 2);
    user_states.set(ctx.from.id, 'menu'); //Go to menu
  }
  else {
    ctx.deleteMessage()
    ctx.reply("Неправильно. Назад у меню.", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu'); //Go to menu
  }
}*/

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


/*
if (quizs[i].answer !== null) { //is there additional rules?
    let cleanText = (quizs[i].answer as string).replace(/[0-9]/g, '') //OPTIMIZATION REQUIRED
          let cleanNumber = parseInt((quizs[i].answer as string))
          if(cleanNumber >= await getBotUserExp(ctx.from.id) && cleanText == await getUserLocale(ctx.from.id) || !cleanText) { //
            await ctx.reply(quizs[i].id + "\n📋" + quizs[i].header + "\n📄" + quizs[i].description,
            Markup.inlineKeyboard([Markup.button.callback("▶️", quizs[i].header)]))
            .then((message) =>{ setStoredString( tempUserId, message.message_id.toString() ) })
          } //NOT ENOUGH LVL
          else if(cleanNumber < await getBotUserExp(ctx.from.id) && (cleanText == await getUserLocale(ctx.from.id) || !cleanText)){
            await ctx.reply(quizs[i].id + "\n📋" + quizs[i].header + "\n📄" + quizs[i].description
            + "⛔ - LVL > " + ((cleanNumber / 10) - 0.5).toFixed(0))
          }
        }
        else {
          await ctx.reply(quizs[i].id + "\n📋" + quizs[i].header + "\n📄" + quizs[i].description,
          Markup.inlineKeyboard([Markup.button.callback("▶️", quizs[i].header)]))
          .then((message) =>{ setStoredString( tempUserId, message.message_id.toString() ) }); //GET SENT MESSAGE ID
        }
          */


//My lvl old
/*else if (ctx.message.text == await getPhrase("mylvl", ctx.from.id)) {
    let searchResult = await getBotUserByUserId(ctx.from.id)
    if (searchResult === undefined) {
      ctx.reply("No user found")
    }                   //It's bad code because undefined is already checked when bot recieves text
    else {
      await ctx.replyWithExperience(searchResult.exp)
      if (ctx.from.id.toString() == (process.env.ADMIN_ID as string)){
        await ctx.replyWithPhrase("admin", await adminKeyboard(ctx.from.id))
        user_states.set(ctx.from.id, 'admin');
      }
    }
  }*/

/*
await ctx.reply("📋" + quizs[i].header + "\n📄" + quizs[i].description,
            Markup.inlineKeyboard([Markup.button.callback("▶️", quizs[i].header)]))
            .then((message) =>{ setStoredString( tempUserId, message.message_id.toString() ) });
          }
*/

/*
// -return section-
async function general_return_handler(ctx: CustomContext & { message: Message.TextMessage }) {
  if (!ctx.from) return; //exclude undefined in ctx.from
  if (ctx.message.text == await getPhrase("menu", ctx.from.id)) {
    ctx.replyWithPhrase("back", await menuKeyboard(ctx.from.id))
    user_states.set(ctx.from.id, 'menu');
  }
  else
    ctx.replyWithPhrase("useButtons", await returnKeyboard(ctx.from.id))
}*/